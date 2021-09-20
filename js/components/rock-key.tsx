import React, { useState } from "react";
import { OCEANIC_CRUST_COLOR, CONTINENTAL_CRUST_COLOR, LITHOSPHERE_COLOR, MANTLE_COLOR, OCEAN_COLOR, SKY_COLOR_1 } from "../colors/cross-section-colors";
import GabbroDiagram from "../../images/rock-key/svg/gabbro-diagram.svg";
import GabbroImageSrc from "../../images/rock-key/jpg/gabbro-photo@3x.jpg";
import GabbroPatternSrc from "../../images/rock-patterns/gabbro.png";
import BasaltDiagram from "../../images/rock-key/svg/basalt-diagram.svg";
import BasaltImageSrc from "../../images/rock-key/jpg/basalt-photo@3x.jpg";
import BasaltPatternSrc from "../../images/rock-patterns/basalt.png";
import DioriteDiagram from "../../images/rock-key/svg/diorite-diagram.svg";
import DioriteImageSrc from "../../images/rock-key/jpg/diorite-photo@3x.jpg";
import DioritePatternSrc from "../../images/rock-patterns/diorite.png";
import AndesiteDiagram from "../../images/rock-key/svg/granite-diagram.svg";
import AndesiteImageSrc from "../../images/rock-key/jpg/granite-photo@3x.jpg";
import AndesitePatternSrc from "../../images/rock-patterns/granite.png";
import GraniteDiagram from "../../images/rock-key/svg/granite-diagram.svg";
import GraniteImageSrc from "../../images/rock-key/jpg/granite-photo@3x.jpg";
import GranitePatternSrc from "../../images/rock-patterns/granite.png";
import RhyoliteDiagram from "../../images/rock-key/svg/rhyolite-diagram.svg";
import RhyoliteImageSrc from "../../images/rock-key/jpg/rhyolite-photo@3x.jpg";
import RhyolitePatternSrc from "../../images/rock-patterns/rhyolite.png";

import css from "../../css-modules/rock-key.less";

interface IRockDef {
  name: string;
  pattern: string;
  image: string;
  diagram: JSX.Element;
  notes: JSX.Element;
}

interface IRockProps extends IRockDef {
  onRockClick: (rock: string) => void;
}

interface IContainerDef {
  title: string;
  mainColor: string;
  lightColor: string;
  rocks: IRockDef[];
}

interface IContainerProps extends IContainerDef {
  selectedRock: string | null;
  onRockClick: (rock: string) => void;
}

const containers: IContainerDef[] = [
  {
    title: "Igneous Rocks",
    mainColor: "#ba00ba",
    lightColor: "#faeefa",
    rocks: [
      {
        name: "Gabbro",
        pattern: GabbroPatternSrc,
        image: GabbroImageSrc,
        diagram: <GabbroDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> divergent boundary</p>
            <p><b>Origin Rock:</b> magma</p>
            <p><b>Crystal Size:</b> large</p>
          </div>
        )
      },
      {
        name: "Basalt",
        pattern: BasaltPatternSrc,
        image: BasaltImageSrc,
        diagram: <BasaltDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> divergent boundary</p>
            <p><b>Origin Rock:</b> magma</p>
            <p><b>Crystal Size:</b> small</p>
          </div>
        )
      },
      {
        name: "Diorite",
        pattern: DioritePatternSrc,
        image: DioriteImageSrc,
        diagram: <DioriteDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> volcanic island arc</p>
            <p><b>Origin Rock:</b> magma</p>
            <p><b>Crystal Size:</b> large</p>
          </div>
        )
      },
      {
        name: "Andesite",
        pattern: AndesitePatternSrc,
        image: AndesiteImageSrc,
        diagram: <AndesiteDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> volcanic island arc</p>
            <p><b>Origin Rock:</b> magma</p>
            <p><b>Crystal Size:</b> small</p>
          </div>
        )
      },
      {
        name: "Granite",
        pattern: GranitePatternSrc,
        image: GraniteImageSrc,
        diagram: <GraniteDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> continental volcanic arc</p>
            <p><b>Origin Rock:</b> magma</p>
            <p><b>Crystal Size:</b> large</p>
          </div>
        )
      },
      {
        name: "Rhyolite",
        pattern: RhyolitePatternSrc,
        image: RhyoliteImageSrc,
        diagram: <RhyoliteDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> continental island arc</p>
            <p><b>Origin Rock:</b> magma</p>
            <p><b>Crystal Size:</b> small</p>
          </div>
        )
      },
    ]
  },
  {
    title: "Mantle Rocks",
    mainColor: "#ba00ba",
    lightColor: "#faeefa",
    rocks: [
      {
        name: "Gabbro 2",
        pattern: GabbroPatternSrc,
        image: GabbroImageSrc,
        diagram: <GabbroDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> divergent boundary</p>
            <p><b>Origin Rock:</b> magma</p>
            <p><b>Crystal Size:</b> large</p>
          </div>
        )
      },
      {
        name: "Granite 2",
        pattern: GranitePatternSrc,
        image: GraniteImageSrc,
        diagram: <GraniteDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> continental volcanic arc</p>
            <p><b>Origin Rock:</b> magma</p>
            <p><b>Crystal Size:</b> large</p>
          </div>
        )
      }
    ]
  }
];

const Rock = (rock: IRockProps) => (
  <div className={css.rock} key={rock.name} onClick={rock.onRockClick.bind(null, rock.name)}>
    <img src={rock.pattern} /> { rock.name }
  </div>
);

const Container = (props: IContainerProps) => {
  const { title, mainColor, lightColor, rocks, selectedRock, onRockClick } = props;
  const midIndex = Math.ceil(rocks.length * 0.5);
  const firstColumn = rocks.slice(0, midIndex);
  const secondColumn = rocks.slice(midIndex);
  const selectedRockDef = selectedRock && rocks.find(rock => rock.name === selectedRock);

  return (
    <div className={css.container} style={{ borderColor: mainColor }}>
      <div className={css.header} style={{ backgroundColor: mainColor }}>{ title }</div>
      <div className={css.column}>
        { firstColumn.map(rock => <Rock key={rock.name} {...rock} onRockClick={onRockClick} />) }
      </div>
      <div className={css.column}>
        { secondColumn.map(rock => <Rock key={rock.name} {...rock} onRockClick={onRockClick} />) }
      </div>
      {
        selectedRockDef &&
        <div>
          <div className={css.selectedRockImage}><img src={selectedRockDef.image} /></div>
          <div className={css.selectedRockDiagram}>{ selectedRockDef.diagram }</div>
          <div className={css.selectedRockNotes}>{ selectedRockDef.notes }</div>
        </div>
      }
    </div>
  );
};

export const RockKey = () => {
  const [selectedContainer, setSelectedContainer] = useState<number | null>(null);
  const [selectedRock, setSelectedRock] = useState<string | null>(null);
  return (
    <div className={css.rockKey}>
      <div className={css.title}>Key: Rock Types</div>
      {
        containers.map((container, idx) => {
          const selectedRockInContainer = idx === selectedContainer ? selectedRock : null;
          const onRockClick = (rock: string) => {
            setSelectedContainer(idx);
            setSelectedRock(rock);
          };
          return <Container key={idx} {...container} selectedRock={selectedRockInContainer} onRockClick={onRockClick} />;
        })
      }
    </div>
  );
};
