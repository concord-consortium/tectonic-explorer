import React from 'react';
import Plates from './plates';
import IndexPage from './index-page';
import { getURLParam } from '../utils';

import '../../css/app.less';

const preset = getURLParam('preset');

const App = () => (
    <div className="app">
      { preset ? <Plates preset={preset}/> : <IndexPage/> }
    </div>
);

export default App;
