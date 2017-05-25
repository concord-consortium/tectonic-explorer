import React, { PureComponent } from 'react';
import presets from '../presets';

import '../../css/index-page.less';

export default class IndexPage extends PureComponent {
  render() {
    return (
      <div className="index-page">
        <h1>3D Plate Tectonics models</h1>
        <table>
          <tbody>
          {
            Object.keys(presets).map(name => <Preset key={name} name={name} img={presets[name].img}/>)
          }
          </tbody>
        </table>
      </div>
    );
  }
}

const Preset = props => (
  <tr>
    <td>
      <a
        href={`${window.location.pathname}?preset=${props.name}`} target="_blank" rel="noopener noreferrer"
      >{props.name}</a>
    </td>
    <td><img alt="data-img" src={props.img} /></td>
  </tr>
);
