export class TimezoneUtil {
  private static readonly TIMEZONE = "Asia/Jakarta";

  static now(): Date {
    return this.toGMT7(new Date());
  }

  static toGMT7(date: Date | string): Date {
    let inputDate: Date;

    if (typeof date === "string") {
      if (date.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = date.split("-");
        inputDate = new Date(
          Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
        );
      } else inputDate = new Date(date);
    } else inputDate = date;

    if (isNaN(inputDate.getTime()))
      throw new Error(`Invalid date provided: ${String(date)}`);

    return new Date(inputDate.getTime() + 7 * 60 * 60 * 1000);
  }

  static addYearToDateSimple(
    dateString: string,
    yearsToAdd: number = 1,
  ): string {
    const [day, month, year] = dateString.split("-");
    const newYear = parseInt(year) + yearsToAdd;
    return `${day}-${month}-${newYear}`;
  }

  static formatDate(
    date: Date | string,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const inputDate = typeof date === "string" ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: this.TIMEZONE,
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return inputDate.toLocaleDateString("id-ID", {
      ...defaultOptions,
      ...options,
    });
  }

  static formatDateTime(
    date: Date | string,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const inputDate = typeof date === "string" ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: this.TIMEZONE,
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };

    return inputDate.toLocaleString("id-ID", { ...defaultOptions, ...options });
  }

  static formatTime(
    date: Date | string,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const inputDate = typeof date === "string" ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: this.TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };

    return inputDate.toLocaleTimeString("id-ID", {
      ...defaultOptions,
      ...options,
    });
  }

  static startOfDay(date?: Date | string): Date {
    const inputDate = date
      ? typeof date === "string"
        ? new Date(date)
        : date
      : new Date();
    const dateInGMT7 = this.toGMT7(inputDate);
    dateInGMT7.setHours(0, 0, 0, 0);
    return dateInGMT7;
  }

  static endOfDay(date?: Date | string): Date {
    const inputDate = date
      ? typeof date === "string"
        ? new Date(date)
        : date
      : new Date();
    const dateInGMT7 = this.toGMT7(inputDate);
    dateInGMT7.setHours(23, 59, 59, 999);
    return dateInGMT7;
  }

  static addDays(date: Date | string, days: number): Date {
    const inputDate = typeof date === "string" ? new Date(date) : date;
    const result = this.toGMT7(inputDate);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addMonths(date: Date | string, months: number): Date {
    const inputDate = typeof date === "string" ? new Date(date) : date;
    const result = this.toGMT7(inputDate);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  static addYears(date: Date | string, years: number): Date {
    const inputDate = typeof date === "string" ? new Date(date) : date;
    const result = this.toGMT7(inputDate);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  static getTimezone(): string {
    return this.TIMEZONE;
  }

  static getTimezoneOffset(): number {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const gmt7 = new Date(
      utc.toLocaleString("id-ID", { timeZone: this.TIMEZONE }),
    );
    return (gmt7.getTime() - utc.getTime()) / (1000 * 60 * 60);
  }

  static toISOString(date: Date | string): string {
    const inputDate = typeof date === "string" ? new Date(date) : date;
    return this.toGMT7(inputDate).toISOString();
  }

  static toReadableString(date: Date | string): string {
    return this.formatDateTime(date, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  static isMoreThan7Days(createdAt: Date) {
    const createdDate = this.toGMT7(createdAt);
    const currentDate = this.now();

    const timeDifference = Number(currentDate) - Number(createdDate);
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    return timeDifference > sevenDaysInMs;
  }

  static isMoreThanXDays(createdAt: Date, days: number) {
    const createdDate = this.toGMT7(createdAt);
    const currentDate = this.now();

    const timeDifference = Number(currentDate) - Number(createdDate);
    const daysInMs = days * 24 * 60 * 60 * 1000;

    return timeDifference > daysInMs;
  }

  static getRemainingDays(createdAt: Date) {
    const createdDate = this.toGMT7(createdAt);
    const currentDate = this.now();

    const timeDifference = Number(currentDate) - Number(createdDate);
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    if (timeDifference >= sevenDaysInMs) return 0;

    const remainingMs = sevenDaysInMs - timeDifference;
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

    return remainingDays;
  }

  static getLastDayOfMonth(date?: Date): Date {
    const inputDate = date || new Date();
    const year = inputDate.getFullYear();
    const month = inputDate.getMonth() + 1;

    return this.toGMT7(new Date(year, month, 0));
  }

  static getLastDayOfMonthString(
    date?: Date,
    format: string = "YYYY-MM-DD",
  ): string {
    const lastDay = this.getLastDayOfMonth(date);

    switch (format) {
      case "YYYY-MM-DD":
        return lastDay.toISOString().split("T")[0];
      case "DD/MM/YYYY":
        return `${lastDay.getDate().toString().padStart(2, "0")}/${(lastDay.getMonth() + 1).toString().padStart(2, "0")}/${lastDay.getFullYear()}`;
      default:
        return lastDay.toISOString();
    }
  }

  static diffDays(time_start: Date, time_end: Date): number {
    const diffTime = Math.abs(time_end.getTime() - time_start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
