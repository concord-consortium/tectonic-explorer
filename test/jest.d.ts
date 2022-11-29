declare namespace jest {
  interface Matchers<> {
    toBePrettyClose(b: number, property: string): CustomMatcherResult;
  }
}
