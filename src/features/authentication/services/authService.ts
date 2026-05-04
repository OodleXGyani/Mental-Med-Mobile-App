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
};

type LoginApiResponse = {
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
    }>;
    error?: string | null;
  };
  home_page?: string;
  full_name?: string;
};

const LOGIN_URL =
  'https://brodie-unsooty-kenny.ngrok-free.dev/api/method/erp_pharmacy.api.user_auth.login';

const getErrorMessage = (responseBody: unknown, fallback: string) => {
  if (!responseBody || typeof responseBody !== 'object') {
    return fallback;
  }

  const body = responseBody as LoginApiResponse;
  const messageBlock = body.message;

  if (messageBlock) {
    if (typeof messageBlock.error === 'string' && messageBlock.error.trim()) {
      return messageBlock.error;
    }

    if (
      typeof messageBlock.message === 'string' &&
      messageBlock.message.trim()
    ) {
      return messageBlock.message;
    }
  }

  return fallback;
};

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as LoginApiResponse;
  } catch {
    return text;
  }
};

const normalizeSession = (responseBody: LoginApiResponse): LoginSession => {
  const loginData = responseBody.message?.data;

  if (!responseBody.message?.success || !loginData?.sid) {
    throw new Error(
      getErrorMessage(
        responseBody,
        'Unable to login. Please check your credentials.',
      ),
    );
  }

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
    fullName:
      responseBody.full_name ?? loginData.username ?? loginData.email ?? '',
  };
};

export const authService = {
  login: async ({ email, password }: LoginPayload): Promise<LoginSession> => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      throw new Error('Email and password are required.');
    }

    let response: Response;
    console.log('Attempting login with email:', trimmedEmail);
    console.log('Login URL:', LOGIN_URL);
    console.log('Login request payload:', {
      email: trimmedEmail,
      password: '********', // Do not log the actual password
    });

    try {
      response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: trimmedPassword,
        }),
      });
      console.log('Login response status:', response.status);
    } catch {
      throw new Error(
        'Network error. Please check your connection and try again.',
      );
    }

    const responseBody = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          responseBody,
          `Login failed (${response.status}) . Please try again.`,
        ),
      );
    }

    if (!responseBody || typeof responseBody !== 'object') {
      throw new Error('Unexpected login response from the server.');
    }

    return normalizeSession(responseBody as LoginApiResponse);
  },
};
