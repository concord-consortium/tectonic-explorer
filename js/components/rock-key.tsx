import React, { useState } from "react";
import { IGNEOUS_PURPLE, MANTLE_PURPLE, METAMORPHIC_GREEN, SEDIMENTARY_YELLOW, SEDIMENTS_ORANGE, MAGMA_RED,
  IGNEOUS_PURPLE_LIGHT, MANTLE_PURPLE_LIGHT, METAMORPHIC_GREEN_LIGHT, SEDIMENTARY_YELLOW_LIGHT, SEDIMENTS_ORANGE_LIGHT,
  MAGMA_RED_LIGHT, OTHER_GRAY, OTHER_GRAY_LIGHT } from "../colors/rock-colors";
import GabbroDiagram from "../../images/rock-key/svg/gabbro-diagram.svg";
import GabbroImageSrc from "../../images/rock-key/jpg/gabbro-photo@3x.jpg";
import GabbroPatternSrc from "../../images/rock-patterns/gabbro.png";
import BasaltDiagram from "../../images/rock-key/svg/basalt-diagram.svg";
import BasaltImageSrc from "../../images/rock-key/jpg/basalt-photo@3x.jpg";
import BasaltPatternSrc from "../../images/rock-patterns/basalt.png";
import DioriteDiagram from "../../images/rock-key/svg/diorite-diagram.svg";
import DioriteImageSrc from "../../images/rock-key/jpg/diorite-photo@3x.jpg";
import DioritePatternSrc from "../../images/rock-patterns/diorite.png";
import AndesiteDiagram from "../../images/rock-key/svg/andesite-diagram.svg";
import AndesiteImageSrc from "../../images/rock-key/jpg/andesite-photo@3x.jpg";
import AndesitePatternSrc from "../../images/rock-patterns/andesite.png";
import GraniteDiagram from "../../images/rock-key/svg/granite-diagram.svg";
import GraniteImageSrc from "../../images/rock-key/jpg/granite-photo@3x.jpg";
import GranitePatternSrc from "../../images/rock-patterns/granite.png";
import RhyoliteDiagram from "../../images/rock-key/svg/rhyolite-diagram.svg";
import RhyoliteImageSrc from "../../images/rock-key/jpg/rhyolite-photo@3x.jpg";
import RhyolitePatternSrc from "../../images/rock-patterns/rhyolite.png";
import MantleImageSrc from "../../images/rock-key/jpg/mantle-photo@3x.jpg";
import LowGradeMetamorphicRockImageSrc from "../../images/rock-key/svg/low-grade-metamorphic-rock-diagram.svg";
import MediumGradeMetamorphicRockImageSrc from "../../images/rock-key/svg/medium-grade-metamorphic-rock-diagram.svg";
import HighGradeMetamorphicRockImageSrc from "../../images/rock-key/svg/high-grade-metamorphic-rock-diagram.svg";
import SandstoneDiagram from "../../images/rock-key/svg/sandstone-diagram.svg";
import SandstoneImageSrc from "../../images/rock-key/jpg/sandstone-photo@3x.jpg";
import SandstonePatternSrc from "../../images/rock-patterns/sandstone.png";
import ShaleDiagram from "../../images/rock-key/svg/shale-diagram.svg";
import ShaleImageSrc from "../../images/rock-key/jpg/shale-photo@3x.jpg";
import ShalePatternSrc from "../../images/rock-patterns/shale.png";
import LimestoneDiagram from "../../images/rock-key/svg/limestone-diagram.svg";
import LimestoneImageSrc from "../../images/rock-key/jpg/limestone-photo@3x.jpg";
import LimestonePatternSrc from "../../images/rock-patterns/limestone.png";
import OceanicSedimentsImageSrc from "../../images/rock-key/jpg/oceanic-sediments-photo@3x.jpg";
import OceanicSedimentPatternSrc from "../../images/rock-patterns/oceanic-sediment.png";
import ContinentalSedimentsImageSrc from "../../images/rock-key/jpg/continental-sediments-photo@3x.jpg";
import ContinentalSedimentPatternSrc from "../../images/rock-patterns/continental-sediment.png";
import SilicaRichMagmaDiagram from "../../images/rock-key/svg/silica-rich-magma-diagram.svg";
import IntermediateMagmaDiagram from "../../images/rock-key/svg/intermediate-magma-diagram.svg";
import IronRichMagmaDiagram from "../../images/rock-key/svg/iron-rich-magma-diagram.svg";
import MagmaImageSrc from "../../images/rock-key/jpg/magma-photo@3x.jpg";
import TakeSampleIcon from "../../images/rock-key/svg/take-sample-icon.svg";

import css from "../../css-modules/rock-key.less";

interface IRockDef {
  name: string;
  pattern: string;
  image?: string;
  diagram?: JSX.Element;
  notes: JSX.Element;
}

interface IRockProps extends IRockDef {
  onRockClick: (rock: string) => void;
}

interface IPatternProps {
  rockName: string;
  pattern: string;
}

interface IContainerDef {
  title: string;
  mainColor: string;
  lightColor: string;
  rocks: IRockDef[];
}

interface IContainerProps extends IContainerDef {
  selectedRock?: string | null;
  onRockClick: (rock: string) => void;
}

const containers: IContainerDef[] = [
  {
    title: "Igneous Rocks",
    mainColor: IGNEOUS_PURPLE,
    lightColor: IGNEOUS_PURPLE_LIGHT,
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
    mainColor: MANTLE_PURPLE,
    lightColor: MANTLE_PURPLE_LIGHT,
    rocks: [
      {
        name: "Mantle (brittle)",
        pattern: "mantleBrittle",
        image: MantleImageSrc,
        diagram: <GabbroDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> below the crust</p>
            <p><b>Crystal Size:</b> large</p>
          </div>
        )
      },
      {
        name: "Mantle (ductile)",
        pattern: "mantleDuctile",
        image: MantleImageSrc,
        diagram: <GraniteDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> continental volcanic arc</p>
            <p><b>Crystal Size:</b> large</p>
          </div>
        )
      }
    ]
  },
  {
    title: "Metamorphic Rocks",
    mainColor: METAMORPHIC_GREEN,
    lightColor: METAMORPHIC_GREEN_LIGHT,
    rocks: [
      {
        name: "Low Grade",
        pattern: "lowGradeMetamorphic",
        image: LowGradeMetamorphicRockImageSrc,
        diagram: <GabbroDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> shallow subductionzone, shallow collision boundaries</p>
            <p><b>Origin Rock:</b> any</p>
            <p><b>Crystal Size:</b> low temperature and low pressure</p>
          </div>
        )
      },
      {
        name: "Medium Grade",
        pattern: "mediumGradeMetamorphic",
        image: MediumGradeMetamorphicRockImageSrc,
        diagram: <GraniteDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> subduction zone, collision boundaries</p>
            <p><b>Origin Rock:</b> any</p>
            <p><b>Crystal Size:</b> high temperature and low pressure, or low temperature and high pressure</p>
          </div>
        )
      },
      {
        name: "High Grade",
        pattern: "highGradeMetamorphic",
        image: HighGradeMetamorphicRockImageSrc,
        diagram: <GraniteDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> deep subduction zone, deep collision boundaries</p>
            <p><b>Origin Rock:</b> any</p>
            <p><b>Crystal Size:</b> high temperature and high pressure</p>
          </div>
        )
      }
    ]
  },
  {
    title: "Sedimentary Rocks",
    mainColor: SEDIMENTARY_YELLOW,
    lightColor: SEDIMENTARY_YELLOW_LIGHT,
    rocks: [
      {
        name: "Sandstone",
        pattern: SandstonePatternSrc,
        image: SandstoneImageSrc,
        diagram: <SandstoneDiagram />,
        notes: (
          <div>
            <p><b>Depositional Environment:</b> shorelines, riverbanks, at the base of mountains</p>
            <p><b>Prior Rock Type:</b> continental sediments</p>
            <p><b>Particle Size:</b> medium</p>
          </div>
        )
      },
      {
        name: "Shale",
        pattern: ShalePatternSrc,
        image: ShaleImageSrc,
        diagram: <ShaleDiagram />,
        notes: (
          <div>
            <p><b>Depositional Environment:</b> underwater</p>
            <p><b>Prior Rock Type:</b> continental sediments</p>
            <p><b>Particle Size:</b> small</p>
          </div>
        )
      },
      {
        name: "Limestone",
        pattern: LimestonePatternSrc,
        image: LimestoneImageSrc,
        diagram: <LimestoneDiagram />,
        notes: (
          <div>
            <p><b>Depositional Environment:</b> underwater</p>
            <p><b>Prior Rock Type:</b> organic deposits</p>
            <p><b>Particle Size:</b> small</p>
          </div>
        )
      }
    ]
  },
  {
    title: "Sediments",
    mainColor: SEDIMENTS_ORANGE,
    lightColor: SEDIMENTS_ORANGE_LIGHT,
    rocks: [
      {
        name: "Oceanic Sediments",
        pattern: OceanicSedimentPatternSrc,
        image: OceanicSedimentsImageSrc,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> many</p>
            <p><b>Origin :</b> sea life, continental rocks, space dust</p>
          </div>
        )
      },
      {
        name: "Continental",
        pattern: ContinentalSedimentPatternSrc, //TODO need the real pattern link
        image: ContinentalSedimentsImageSrc,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> many</p>
            <p><b>Origin:</b> continental rocks</p>
          </div>
        )
      }
    ]
  },
  {
    title: "Magma",
    mainColor: MAGMA_RED,
    lightColor: MAGMA_RED_LIGHT,
    rocks: [
      {
        name: "Silica-rich",
        pattern: "silicaRichMagma",
        image: MagmaImageSrc,
        diagram: <SilicaRichMagmaDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> continental volcanic arcs</p>
            <p><b>Composition:</b> more silica, less iron</p>
            <p><b>Origin Rock:</b> mantle rocks</p>
          </div>
        )
      },
      {
        name: "Intermediate",
        pattern: "intermediateMagma",
        image: MagmaImageSrc,
        diagram: <IntermediateMagmaDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> volcanic island arcs</p>
            <p><b>Composition:</b> medium silica and iron</p>
            <p><b>Origin Rock:</b> mantle rocks</p>
          </div>
        )
      },
      {
        name: "Iron-rich ",
        pattern: "ironRichMagma",
        image: MagmaImageSrc,
        diagram: <IronRichMagmaDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> divergent boundaries, subduction zones</p>
            <p><b>Composition:</b> less silica, more iron</p>
            <p><b>Origin Rock:</b> mantle rocks</p>
          </div>
        )
      }
    ]
  },
  {
    title: "Other",
    mainColor: OTHER_GRAY,
    lightColor: OTHER_GRAY_LIGHT,
    rocks: [
      {
        name: "Sky",
        pattern: "sky",
        notes: (
          <div />
        )
      },
      {
        name: "Ocean",
        pattern: "ocean",
        notes: (
          <div />
        )
      }
    ]
  }
];

const Container = (props: IContainerProps) => {
  const { title, mainColor, lightColor, rocks, selectedRock, onRockClick } = props;
  const midIndex = Math.ceil(rocks.length * 0.5);
  const firstColumn = rocks.slice(0, midIndex);
  const secondColumn = rocks.slice(midIndex);
  const selectedRockDef = selectedRock && rocks.find(rock => rock.name === selectedRock);
  const Rock = (rock: IRockProps) => (
    <div className={css.rock} key={rock.name} onClick={rock.onRockClick.bind(null, rock.name)}>
      {  <TakeSampleIcon className={`${css.rockPickerTool} ${selectedRock === rock.name ? css.selected: ""}`} style={{ borderColor: mainColor }} /> }
      <div className={`${css.patternContainer} ${selectedRock === rock.name ? css.selected: ""}`} style={{ borderColor: mainColor }}>
        { (rock.pattern).includes("png")
          ? <img src={rock.pattern} />
          : <div className={`${css.patternIcon} ${css[rock.pattern]}`} />
        }
      </div>
      { rock.name }
    </div>
  );

  return (
    <div className={css.container} style={{ borderColor: mainColor }}>
      <div className={css.header} style={{ backgroundColor: mainColor }}>{ title }</div>
      <div className={css.content}>
        <div className={css.column}>
          { firstColumn.map(rock =>
            <Rock key={rock.name} {...rock} onRockClick={onRockClick} />) }
        </div>
        <div className={css.column}>
          { secondColumn.map(rock =>
            <Rock key={rock.name} {...rock} onRockClick={onRockClick} />) }
        </div>
        {
          selectedRockDef &&
          <div className={css.expanded} style={{ backgroundColor: lightColor, borderColor: mainColor }}>
            <div className={css.selectedRockTitle}>{ selectedRockDef.name }</div>
            <div className={css.selectedRockImage}><img src={selectedRockDef.image} /></div>
            <div className={css.selectedRockDiagram}>{ selectedRockDef.diagram }</div>
            <div className={css.selectedRockNotes}>{ selectedRockDef.notes }</div>
          </div>
        }
      </div>
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
