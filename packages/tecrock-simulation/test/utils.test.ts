import { getURLParam } from "../src/utils";

describe("getURLParam", () => {

  // mocking code cribbed from CLUE
  const originalLocation = window.location;

  const mockWindowLocation = (newLocation: Location | URL) => {
    delete (window as any).location;
    window.location = newLocation as Location;
  };

  const setLocation = (url: string) => {
    mockWindowLocation(new URL(url));
  };

  const testQueryParam = (params: string, name: string) => {
    setLocation(`https://concord.org${params ? `?${params}` : ""}`);
    return getURLParam(name);
  };

  afterEach(() => {
    mockWindowLocation(originalLocation);
  });

  it("should return null for nonexistent parameters", () => {
    expect(testQueryParam("", "foo")).toBeNull();
    expect(testQueryParam("bar=roo", "foo")).toBeNull();
  });

  it("should return true for parameters without values", () => {
    expect(testQueryParam("foo&bar", "foo")).toBe(true);
    expect(testQueryParam("foo&bar", "bar")).toBe(true);
    expect(testQueryParam("foo=&bar=", "foo")).toBe(true);
    expect(testQueryParam("foo=&bar=", "bar")).toBe(true);
  });

  it("should return the value for parameters with values", () => {
    expect(testQueryParam("foo=bar", "foo")).toBe("bar");
    expect(testQueryParam("foo=bar&baz=roo", "foo")).toBe("bar");
    expect(testQueryParam("foo=bar&baz=roo", "baz")).toBe("roo");
  });

  it("should process names with square brackets", () => {
    // the purpose of the square-bracket name processing code is not entirely clear
    expect(testQueryParam("foo[]=bar", "foo[]")).toBe("bar");
  });

  it("should return stringified array results", () => {
    expect(testQueryParam("foo=[bar,baz,roo]", "foo")).toBe("[bar,baz,roo]");
  });

  it("should decode encoded characters in returned values", () => {
    expect(testQueryParam("foo=bar%20baz", "foo")).toBe("bar baz");
  });

  it("should replace '+' with ' ' in returned values", () => {
    expect(testQueryParam("foo=bar+baz", "foo")).toBe("bar baz");
  });

  it("should ignore hash parameters", () => {
    expect(testQueryParam("foo=bar#baz=roo", "foo")).toBe("bar");
    expect(testQueryParam("foo=bar#baz=roo", "baz")).toBeNull();
    expect(testQueryParam("#foo=bar&baz=roo", "foo")).toBeNull();
    // code as written ignores the first hash param but accepts subsequent ones
    // expect(testQueryParam("#foo=bar&baz=roo", "baz")).toBeNull();
  });
});
