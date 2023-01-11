const getNewIframeEndpoint = () => {
  const result: any = {
    initialize: jest.fn(),
    addListener: jest.fn((type: string, handler: any) => result._handlers[type] = handler),
    post: jest.fn(),
    disconnect: jest.fn(),
    // Mock helpers.
    _handlers: {},
    _trigger: (type: string, data: any) => iframeEndpoint._handlers[type](data)
  };
  return result;
};

let iframeEndpoint = getNewIframeEndpoint();

export default {
  getIFrameEndpoint: () => iframeEndpoint,
  // Mock helpers.
  _resetMock: () => {
    iframeEndpoint = getNewIframeEndpoint()
  }
};
