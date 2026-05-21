import { API_BASE_URL } from '../../../shared/constants/apiConfig';

export type UserProfile = {
  employee: string;
  employee_name: string;
  employee_number: string | null;
  company: string;
  designation: string;
  department: string;
  date_of_joining: string;
  employee_status: string;
  mobile_no: string;
  personal_email: string | null;
  company_email: string | null;
  gender: string;
  image: string | null;
  user_id: string;
  full_name: string;
  enabled: number;
  last_login: string;
  reporting_manager: string | null;
  reporting_manager_name: string | null;
  today_attendance: string | null;
  checkin_status: 'IN' | 'OUT' | null;
};

export const profileService = {
  fetchUserProfile: async (): Promise<UserProfile> => {
    const url = new URL(
      `${API_BASE_URL}api/method/erp_pharmacy.api.mobile_api.profile.get_user_profile`,
    );

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error('Unable to load profile.');
    }

    return payload.message as UserProfile;
  },
};
