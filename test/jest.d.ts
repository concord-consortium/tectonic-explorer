declare namespace jest {
  interface Matchers<R> {
    toBePrettyClose(b: number, property: string): CustomMatcherResult;
  }
}
