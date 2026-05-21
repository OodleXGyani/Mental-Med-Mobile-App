import { API_BASE_URL } from '../../../shared/constants/apiConfig';

export type LeaveTypeOption = {
  label: string;
  value: string;
};

export type CreateLeaveRequestPayload = {
  employee: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  company: string;
  description: string;
  half_day: 0 | 1;
};

export const attendanceService = {
  fetchAttendanceSummary: async (
    fromDate: string,
    toDate: string,
    employee: string,
  ) => {
    const url = new URL(
      `${API_BASE_URL}api/method/erp_pharmacy.api.mobile_api.attendance.get_attendance_summary`,
    );
    url.searchParams.set('from_date', fromDate);
    url.searchParams.set('to_date', toDate);
    url.searchParams.set('employee', employee);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error('Unable to load attendance summary.');
    }

    return payload.message as {
      from_date: string;
      to_date: string;
      summary: {
        Present: number;
        'Half Day': number;
        Leave: number;
      };
    };
  },

  fetchAttendanceByDate: async (
    fromDate: string,
    toDate: string,
    employee: string,
  ) => {
    const url = new URL(
      `${API_BASE_URL}api/method/erp_pharmacy.api.mobile_api.attendance.get_attendance_by_date`,
    );
    url.searchParams.set('from_date', fromDate);
    url.searchParams.set('to_date', toDate);
    url.searchParams.set('employee', employee);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error('Unable to load attendance calendar.');
    }

    return payload.message as Array<{
      attendance_date: string;
      status: string;
      in_time: string | null;
      out_time: string | null;
      working_hours: number;
    }>;
  },

  createEmployeeCheckin: async (payload: {
    employee: string;
    log_type: 'IN' | 'OUT';
    latitude: number;
    longitude: number;
  }) => {
    const response = await fetch(
      `${API_BASE_URL}api/resource/Employee%20Checkin`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error('Unable to submit attendance check-in.');
    }

    return data.data as {
      name: string;
      employee: string;
      employee_name: string;
      log_type: 'IN' | 'OUT';
      latitude: number;
      longitude: number;
    };
  },

  fetchLeaveTypeDropdown: async (): Promise<LeaveTypeOption[]> => {
    const response = await fetch(
      `${API_BASE_URL}api/method/erp_pharmacy.api.staff_management.get_leave_type_dropdown`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const payload = await response.json();

    if (!response.ok || payload.message?.success === false) {
      throw new Error(
        payload.message?.error ||
          payload.message?.message ||
          'Unable to load leave types.',
      );
    }

    const leaveTypes = Array.isArray(payload.message?.data)
      ? payload.message.data
      : [];

    return leaveTypes
      .filter(
        (item: Partial<LeaveTypeOption>) =>
          typeof item.label === 'string' && typeof item.value === 'string',
      )
      .map((item: LeaveTypeOption) => ({
        label: item.label,
        value: item.value,
      }));
  },

  createLeaveRequest: async (payload: CreateLeaveRequestPayload) => {
    const response = await fetch(
      `${API_BASE_URL}api/method/erp_pharmacy.api.staff_management.create_leave_request`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok || data.message?.success === false) {
      throw new Error(
        data.message?.error ||
          data.message?.message ||
          'Unable to submit leave request.',
      );
    }

    return data.message;
  },
};
