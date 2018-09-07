import moment from 'moment';

export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function getCurrentDate(): string {
  return moment().format('YYYY-MM-DD');
}