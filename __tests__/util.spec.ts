import * as Util from "../src/util";

describe("Test util methods", async () => {
  test("Date string with formatter YYYY-MM-DDTHH:MM:SSSZ", () => {
    let dateString = Util.getCurrentDate(
      "20130208T080910",
      "YYYY-MM-DDTHH:MM:SSZ"
    );
    expect(dateString).toBe("2013-02-08T08:09:10Z");
  });

  test("Date string with formatter YYYY-MM-DD", () => {
    let dateString = Util.getCurrentDate("20130208T080910");
    expect(dateString).toBe("2013-02-08");
  });
});
