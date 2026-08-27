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

const extractFrappeErrorMessage = (data: any, fallback: string): string => {
  if (!data) {
    return fallback;
  }

  if (typeof data._server_messages === 'string') {
    try {
      const messages = JSON.parse(data._server_messages);
      if (Array.isArray(messages) && messages.length > 0) {
        const firstMessage =
          typeof messages[0] === 'string'
            ? JSON.parse(messages[0])
            : messages[0];
        if (firstMessage?.message) {
          return String(firstMessage.message).replace(/<[^>]*>?/gm, '').trim();
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }

  if (data.message && typeof data.message === 'object') {
    if (data.message.error) return String(data.message.error);
    if (data.message.message) return String(data.message.message);
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  if (typeof data.exception === 'string') {
    const lines = data.exception.split('\n').filter(Boolean);
    const lastLine = lines[lines.length - 1] || data.exception;
    return lastLine.replace(/^[\w.]+Error:\s*/, '').trim();
  }

  if (typeof data.error === 'string') {
    return data.error;
  }

  return fallback;
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

    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      // payload not JSON
    }

    if (!response.ok) {
      throw new Error(
        extractFrappeErrorMessage(payload, 'Unable to load attendance summary.'),
      );
    }

    const message = payload?.message || {};
    const rawSummary = message.summary || {};

    return {
      from_date: message.from_date || fromDate,
      to_date: message.to_date || toDate,
      summary: {
        Present: Number(rawSummary.Present ?? rawSummary.present ?? 0),
        'Half Day': Number(rawSummary['Half Day'] ?? rawSummary.half_day ?? 0),
        Leave: Number(rawSummary.Leave ?? rawSummary.leave ?? 0),
      },
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

    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      // payload not JSON
    }

    if (!response.ok) {
      throw new Error(
        extractFrappeErrorMessage(payload, 'Unable to load attendance calendar.'),
      );
    }

    const records = Array.isArray(payload?.message) ? payload.message : [];

    return records.map((item: any) => ({
      attendance_date: String(item?.attendance_date || ''),
      status: String(item?.status || 'Absent'),
      in_time: item?.in_time ? String(item.in_time) : null,
      out_time: item?.out_time ? String(item.out_time) : null,
      working_hours: Number(item?.working_hours || 0),
    }));
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

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // data not JSON
    }

    if (!response.ok) {
      throw new Error(
        extractFrappeErrorMessage(
          data,
          'Unable to submit attendance check-in.',
        ),
      );
    }

    return (data?.data || {}) as {
      name: string;
      employee: string;
      employee_name: string;
      log_type: 'IN' | 'OUT';
      latitude: number;
      longitude: number;
    };
  },

  fetchLeaveTypeDropdown: async (employee?: string): Promise<LeaveTypeOption[]> => {
    const url = new URL(
      `${API_BASE_URL}api/method/erp_pharmacy.api.staff_management.get_leave_type_dropdown`,
    );
    if (employee) {
      url.searchParams.set('employee', employee);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      // payload not JSON
    }

    if (!response.ok || payload?.message?.success === false) {
      throw new Error(
        extractFrappeErrorMessage(payload, 'Unable to load leave types.'),
      );
    }

    const rawList = Array.isArray(payload?.message?.data)
      ? payload.message.data
      : Array.isArray(payload?.message)
      ? payload.message
      : [];

    return rawList
      .filter(
        (item: Partial<LeaveTypeOption>) =>
          Boolean(item) &&
          typeof item.label === 'string' &&
          typeof item.value === 'string',
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

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // data not JSON
    }

    if (!response.ok || data?.message?.success === false) {
      throw new Error(
        extractFrappeErrorMessage(data, 'Unable to submit leave request.'),
      );
    }

    return data?.message;
  },
};

