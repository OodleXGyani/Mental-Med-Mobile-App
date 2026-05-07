export const attendanceService = {
  fetchAttendanceSummary: async (
    fromDate: string,
    toDate: string,
    employee: string,
  ) => {
    const url = new URL(
      'https://brodie-unsooty-kenny.ngrok-free.dev/api/method/erp_pharmacy.api.mobile_api.attendance.get_attendance_summary',
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
      'https://brodie-unsooty-kenny.ngrok-free.dev/api/method/erp_pharmacy.api.mobile_api.attendance.get_attendance_by_date',
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
      'https://brodie-unsooty-kenny.ngrok-free.dev/api/resource/Employee%20Checkin',
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
};
