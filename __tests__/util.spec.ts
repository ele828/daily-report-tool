import * as Util from "../src/util";

describe("example test", async () => {
  test("test", () => {
    expect(2).toEqual(1 + 1);
  });

  test("Current date string", () => {
    let currentDate = Util.getCurrentDate();
    expect(currentDate.length).toBe(10);
  });
});
