import * as Util from "../src/util";

describe("Test util methods", async () => {
  test("Date string with formatter YYYY-MM-DDTHH:MM:SSZ", () => {
    let dateString = Util.getCurrentDate(
      "20130208T080910",
      "YYYY-MM-DDTHH:MM:SSZ"
    );
    expect(dateString).toBe("2013-02-08T00:02:00+00:00");
  });
  test("Date string with formatter YYYY-MM-DD dddd", () => {
    let dateString = Util.getCurrentDate("20130208T080910");
    expect(dateString).toBe("2013-02-08 Friday");
  });
});
