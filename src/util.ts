import moment from "moment";

const DEFAULT_DATE_FORMAT = "YYYY-MM-DD dddd";
export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * Format current date with formatter
 * @param date   Date string formatted like this "20130208T080910".
 * You can refer to https://momentjs.com/docs/#/parsing/ for more details.
 * @param format YYYY-MM-DDTHH:MM:SSSZ or YYYY-MM-DD, or any
 * kind formatter `moment` supports
 */
export function getCurrentDate(date?: string, formatter?: string): string {
  if (!formatter) formatter = DEFAULT_DATE_FORMAT;
  if (!date)
    return moment()
      .utc()
      .format(formatter);
  return moment(date)
    .utc()
    .format(formatter);
}
