import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, SAAS_BASE_URL, setApiBaseUrl } from '../../../shared/constants/apiConfig';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginSession = {
  sid: string;
  apiKey: string;
  apiSecret: string;
  username: string;
  email: string;
  superAdmin: boolean;
  company: string | null;
  roles: string[];
  roleProfile: string | null;
  homePage: string;
  fullName: string;
  tenantUrl: string; // Added tenant URL
  socketUrl: string;
  socketPath: string;
};

export type SaasVerificationRequired = {
  status: 'success';
  status_val: 'verification_required';
  needs_verification: string[];
  otp_token: string;
  expires_in: number;
  phone_hint?: string;
  email_hint?: string;
};

export type SaasVerified = {
  status: 'success';
  tenant: string;
  site_name: string;
  tenant_url: string;
  full_name: string;
  is_admin: boolean;
  username: string;
  password: string; // Plaintext password to pass to tenant
  login_url: string;
  socket_url?: string;
  socket_path?: string;
};

export type SaasLoginResponse = SaasVerificationRequired | SaasVerified;

type TenantLoginApiResponse = {
  message?: {
    success?: boolean;
    message?: string;
    data?: Partial<{
      sid: string;
      api_key: string;
      api_secret: string;
      username: string;
      email: string;
      super_admin: boolean;
      company: string | null;
      roles: string[];
      role_profile: string | null;
      socket_url: string;
      socket_path: string;
    }>;
    error?: string | null;
  };
  home_page?: string;
  full_name?: string;
};

const SAAS_LOGIN_URL = `${SAAS_BASE_URL}api/method/saas_app.api.tenant.login`;
const SAAS_VERIFY_OTP_URL = `${SAAS_BASE_URL}api/method/saas_app.api.tenant.verify_login_otp`;
const SAAS_RESEND_OTP_URL = `${SAAS_BASE_URL}api/method/saas_app.api.tenant.resend_login_otp`;

// Forgot Password is reachable straight from the Login screen, before any
// tenant has ever been resolved on this device -- API_BASE_URL is still
// sitting at its default (SAAS_BASE_URL) for a first-time or freshly
// installed user, not the tenant site the email address actually belongs
// to. saas_app.api.tenant.forgot_password (on the control site) is built
// for exactly this: it looks the person up by email as a Tenant User,
// resolves their real site, and triggers the reset email from there --
// calling the tenant's own erp_pharmacy.api.user_auth.forgot_password
// directly only works by accident, when API_BASE_URL already happens to
// be pointed at the right tenant from a previous successful login.
const FORGOT_PASSWORD_URL = `${SAAS_BASE_URL}api/method/saas_app.api.tenant.forgot_password`;
const UPLOAD_FCM_TOKEN_URL = `${API_BASE_URL}api/method/erp_pharmacy.api.mobile_api.fcm_api.save_fcm_token`;

const AUTH_SESSION_STORAGE_KEY = '@meds/auth-session';

const getTenantErrorMessage = (responseBody: unknown, fallback: string) => {
  if (!responseBody || typeof responseBody !== 'object') {
    return fallback;
  }
  const body = responseBody as TenantLoginApiResponse;
  const messageBlock = body.message;
  
  if (messageBlock) {
    if (typeof messageBlock.error === 'string' && messageBlock.error.trim()) return messageBlock.error;
    if (typeof messageBlock.message === 'string' && messageBlock.message.trim()) return messageBlock.message;
  }
  return fallback;
};

const parseJsonSafely = async <T>(response: Response): Promise<T | string | null> => {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text;
  }
};

const normalizeSession = (responseBody: TenantLoginApiResponse, tenantUrl: string): LoginSession => {
  const messageBlock = responseBody.message;
  const loginData = messageBlock?.data;

  if (!messageBlock?.success || !loginData?.sid) {
    throw new Error(
      getTenantErrorMessage(
        responseBody,
        'Unable to login to tenant. Please check your credentials.'
      )
    );
  }

  // Preserve the full socket_url (e.g. "https://domain.com/site_name_namespace") as sent by Frappe
  const socketUrl = loginData.socket_url || tenantUrl;
  const socketPath = loginData.socket_path || '/socket.io';

  return {
    sid: loginData.sid,
    apiKey: loginData.api_key ?? '',
    apiSecret: loginData.api_secret ?? '',
    username: loginData.username ?? '',
    email: loginData.email ?? '',
    superAdmin: loginData.super_admin ?? false,
    company: loginData.company ?? null,
    roles: Array.isArray(loginData.roles) ? loginData.roles : [],
    roleProfile: loginData.role_profile ?? null,
    homePage: responseBody.home_page ?? '/app',
    fullName: responseBody.full_name ?? loginData.username ?? loginData.email ?? '',
    tenantUrl, // Store the tenant URL for API requests
    socketUrl,
    socketPath,
  };
};

export const authStorage = {
  loadSession: async (): Promise<LoginSession | null> => {
    const rawSession = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!rawSession) return null;
    try {
      return JSON.parse(rawSession) as LoginSession;
    } catch {
      await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return null;
    }
  },
  saveSession: async (session: LoginSession) => {
    await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  },
  clearSession: async () => {
    await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  },
};

export const authService = {
  // Step 1: Hit the SaaS Control Site
  loginHandshake: async ({ email, password }: LoginPayload): Promise<SaasLoginResponse> => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) throw new Error('Email and password are required.');

    let response: Response;
    try {
      response = await fetch(SAAS_LOGIN_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
    } catch {
      throw new Error('Network error connecting to control site.');
    }

    const responseBody = await parseJsonSafely<any>(response);

    if (!response.ok) {
      let errorMsg = responseBody?.message || `Handshake failed (${response.status})`;
      if (typeof errorMsg === 'object') {
        errorMsg = errorMsg.message || errorMsg.error || JSON.stringify(errorMsg);
      }
      throw new Error(errorMsg);
    }
    
    // Frappe wraps custom API responses in a "message" object
    const data = responseBody?.message || responseBody;
    
    if (data?.status !== 'success') {
      const errorMsg = data?.message || data?.error || 'Invalid response from control site.';
      throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
    }

    return data as SaasLoginResponse;
  },

  // Step 2: Verify OTP with SaaS Control Site (if required)
  verifyLoginOtp: async (
    email: string,
    otpToken: string,
    phoneOtp?: string,
    emailOtp?: string
  ): Promise<SaasVerified> => {
    let response: Response;
    try {
      response = await fetch(SAAS_VERIFY_OTP_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp_token: otpToken,
          phone_otp: phoneOtp,
          email_otp: emailOtp,
        }),
      });
    } catch {
      throw new Error('Network error during OTP verification.');
    }

    const responseBody = await parseJsonSafely<any>(response);

    if (!response.ok) {
      let errorMsg = responseBody?.message || 'OTP Verification failed.';
      if (typeof errorMsg === 'object') {
        errorMsg = errorMsg.message || errorMsg.error || JSON.stringify(errorMsg);
      }
      throw new Error(errorMsg);
    }

    const data = responseBody?.message || responseBody;

    if (data?.status !== 'success') {
      const errorMsg = data?.message || data?.error || 'OTP verification returned failure.';
      throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
    }

    return data as SaasVerified;
  },

  // Resend OTP
  resendLoginOtp: async (email: string, password?: string): Promise<SaasLoginResponse> => {
    let response: Response;
    try {
      response = await fetch(SAAS_RESEND_OTP_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('Network error while resending OTP.');
    }

    const responseBody = await parseJsonSafely<any>(response);
    if (!response.ok) throw new Error(responseBody?.message || 'Failed to resend OTP.');
    
    return responseBody as SaasLoginResponse;
  },

  // Step 3: Hit the specific Tenant URL with the payload from SaaS
  tenantLogin: async (
    loginUrl: string,
    tenantUrl: string,
    email: string,
    passwordPlain: string
  ): Promise<LoginSession> => {
    let response: Response;
    try {
      response = await fetch(loginUrl, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordPlain }),
      });
    } catch {
      throw new Error('Network error connecting to tenant site.');
    }

    const responseBody = await parseJsonSafely<any>(response);

    if (!response.ok) {
      throw new Error(getTenantErrorMessage(responseBody, `Tenant login failed (${response.status})`));
    }

    const session = normalizeSession(responseBody as TenantLoginApiResponse, tenantUrl);
    setApiBaseUrl(tenantUrl);
    await authStorage.saveSession(session);
    return session;
  },

  forgotPassword: async (email: string): Promise<string> => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) throw new Error('Email is required.');

    let response: Response;
    try {
      response = await fetch(FORGOT_PASSWORD_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
    } catch {
      throw new Error('Network error. Please check your connection and try again.');
    }

    const responseBody = await parseJsonSafely<any>(response);
    // saas_app.api.tenant.* responses use {status: "success"|"error",
    // message} -- NOT the erp_pharmacy {success: bool, message, error}
    // shape the old endpoint used. Reading `.success`/`.error` here always
    // came back undefined against this endpoint's real shape.
    const data = responseBody?.message;

    if (!response.ok || data?.status !== 'success') {
      throw new Error(
        (typeof data?.message === 'string' && data.message) ||
          `Request failed (${response.status})`,
      );
    }

    return data.message || 'Reset link sent successfully.';
  },

  uploadFCMToken: async (email: string, token: string, deviceType: 'android' | 'ios'): Promise<boolean> => {
    const trimmedEmail = email.trim();
    const trimmedToken = token.trim();
    if (!trimmedEmail || !trimmedToken) throw new Error('Email and FCM token are required.');

    try {
      const response = await fetch(UPLOAD_FCM_TOKEN_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmedToken, device_type: deviceType }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Deactivates this device's push token server-side. Uses `frappe.session.user`
   * to scope the update, so this MUST run before logout() invalidates the
   * session -- calling it after would silently no-op against a Guest session.
   * Best-effort: sign-out should still proceed even if this fails.
   */
  deleteFCMToken: async (token: string): Promise<boolean> => {
    const trimmedToken = token.trim();
    if (!trimmedToken) return false;

    try {
      const response = await fetch(
        `${API_BASE_URL}api/method/erp_pharmacy.api.mobile_api.fcm_api.delete_fcm_token`,
        {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: trimmedToken }),
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Invalidates the current sid server-side (Frappe's own core `logout`
   * whitelisted method). Previously sign-out only cleared local
   * AsyncStorage/Redux state -- the server-side session stayed live
   * indefinitely, so a captured/leaked sid would keep working after the
   * user "signed out" on their device.
   */
  logout: async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}api/method/logout`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
    } catch {
      // Best-effort -- local sign-out proceeds regardless.
    }
  },
};
