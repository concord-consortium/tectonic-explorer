import React from "react";
import { inject, observer } from "mobx-react";
import { BaseComponent, IBaseProps } from "../base";
import {
  AndesiteImage, BasaltImage, ContinentalSedimentsImage, DioriteImage, GabbroImage, GraniteImage, LimestoneImage,
  MagmaImage, MantleImage, OceanicSedimentsImage, RhyoliteImage, SandstoneImage, ShaleImage
} from "../rock-images";
import { IGNEOUS_PURPLE, MANTLE_PURPLE, METAMORPHIC_GREEN, SEDIMENTARY_YELLOW, SEDIMENTS_ORANGE, MAGMA_RED,
  IGNEOUS_PURPLE_LIGHT, MANTLE_PURPLE_LIGHT, METAMORPHIC_GREEN_LIGHT, SEDIMENTARY_YELLOW_LIGHT, SEDIMENTS_ORANGE_LIGHT,
  MAGMA_RED_LIGHT, OTHER_GRAY, OTHER_GRAY_LIGHT, SEDIMENTARY_TITLE_GRAY, CRUST_TYPE, CRUST_TYPE_LIGHT } from "../../colors/rock-colors";
import { CONTINENTAL_CRUST_COLOR, MAGMA_INTERMEDIATE, MAGMA_IRON_RICH, MAGMA_SILICA_RICH, MANTLE_BRITTLE,
  MANTLE_DUCTILE, METAMORPHIC_HIGH_GRADE, METAMORPHIC_LOW_GRADE, METAMORPHIC_MEDIUM_GRADE, OCEANIC_CRUST_COLOR,
  OCEAN_COLOR, SKY_COLOR_1, SKY_COLOR_2 } from "../../colors/cross-section-colors";
import GabbroDiagram from "../../../images/rock-key/svg/gabbro-diagram.svg";
import GabbroPatternSrc from "../../../images/rock-patterns/gabbro-key.png";
import BasaltDiagram from "../../../images/rock-key/svg/basalt-diagram.svg";
import BasaltPatternSrc from "../../../images/rock-patterns/basalt-key.png";
import DioriteDiagram from "../../../images/rock-key/svg/diorite-diagram.svg";
import DioritePatternSrc from "../../../images/rock-patterns/diorite-key.png";
import AndesiteDiagram from "../../../images/rock-key/svg/andesite-diagram.svg";
import AndesitePatternSrc from "../../../images/rock-patterns/andesite-key.png";
import GraniteDiagram from "../../../images/rock-key/svg/granite-diagram.svg";
import GranitePatternSrc from "../../../images/rock-patterns/granite-key.png";
import RhyoliteDiagram from "../../../images/rock-key/svg/rhyolite-diagram.svg";
import RhyolitePatternSrc from "../../../images/rock-patterns/rhyolite-key.png";
import MantleBrittleDiagram from "../../../images/rock-key/svg/mantle-brittle-diagram.svg";
import MantleDuctileDiagram from "../../../images/rock-key/svg/mantle-ductile-diagram.svg";
import LowGradeMetamorphicRockDiagram from "../../../images/rock-key/svg/low-grade-metamorphic-rock-diagram.svg";
import MediumGradeMetamorphicRockDiagram from "../../../images/rock-key/svg/medium-grade-metamorphic-rock-diagram.svg";
import HighGradeMetamorphicRockDiagram from "../../../images/rock-key/svg/high-grade-metamorphic-rock-diagram.svg";
import SandstoneDiagram from "../../../images/rock-key/svg/sandstone-diagram.svg";
import SandstonePatternSrc from "../../../images/rock-patterns/sandstone-key.png";
import ShaleDiagram from "../../../images/rock-key/svg/shale-diagram.svg";
import ShalePatternSrc from "../../../images/rock-patterns/shale-key.png";
import LimestoneDiagram from "../../../images/rock-key/svg/limestone-diagram.svg";
import LimestonePatternSrc from "../../../images/rock-patterns/limestone-key.png";
import OceanicSedimentPatternSrc from "../../../images/rock-patterns/oceanic-sediment-key.png";
import ContinentalSedimentPatternSrc from "../../../images/rock-patterns/continental-sediment-key.png";
import SilicaRichMagmaDiagram from "../../../images/rock-key/svg/silica-rich-magma-diagram.svg";
import IntermediateMagmaDiagram from "../../../images/rock-key/svg/intermediate-magma-diagram.svg";
import IronRichMagmaDiagram from "../../../images/rock-key/svg/iron-rich-magma-diagram.svg";
import TakeSampleIcon from "../../../images/rock-key/svg/take-sample-icon.svg";
import { RockKeyLabel } from "../../types";
import config from "../../config";

import css from "../../../css-modules/keys/rock-types.less";

const FLASH_ANIMATION_DURATION = 500; // note that this value has to match one defined in rock-key.less !

interface IRockDef {
  name?: RockKeyLabel;
  shortName?: string; // if different than full name
  pattern: string;
  image?: JSX.Element;
  diagram?: JSX.Element;
  notes?: JSX.Element;
}

interface IRockProps extends IRockDef {
  onRockClick?: (rock: string | null) => void;
}

interface IContainerDef {
  title: string;
  mainColor: string;
  lightColor: string;
  titleColor?: string;  // defaults to white
  rocks: IRockDef[];
}

const TecRockKey: IContainerDef[] = [
  {
    title: "Igneous Rocks",
    mainColor: IGNEOUS_PURPLE,
    lightColor: IGNEOUS_PURPLE_LIGHT,
    rocks: [
      {
        name: "Gabbro",
        pattern: GabbroPatternSrc,
        image: <GabbroImage />,
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
        image: <BasaltImage />,
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
        image: <DioriteImage />,
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
        image: <AndesiteImage />,
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
        image: <GraniteImage />,
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
        image: <RhyoliteImage />,
        diagram: <RhyoliteDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> continental volcanic arc</p>
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
        pattern: MANTLE_BRITTLE,
        image: <MantleImage />,
        diagram: <MantleBrittleDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> below the crust</p>
          </div>
        )
      },
      {
        name: "Mantle (ductile)",
        pattern: MANTLE_DUCTILE,
        image: <MantleImage />,
        diagram: <MantleDuctileDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> below the crust</p>
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
        shortName: "Low Grade",
        name: "Low Grade Metamorphic Rock",
        pattern: METAMORPHIC_LOW_GRADE,
        diagram: <LowGradeMetamorphicRockDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> shallow subduction zone, shallow collision boundaries</p>
            <p><b>Origin Rock:</b> any</p>
            <p><b>Metamorphic Conditions:</b> low temperature and low pressure</p>
          </div>
        )
      },
      {
        shortName: "Medium Grade",
        name: "Medium Grade Metamorphic Rock",
        pattern: METAMORPHIC_MEDIUM_GRADE,
        diagram: <MediumGradeMetamorphicRockDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> subduction zone, collision boundaries</p>
            <p><b>Origin Rock:</b> any</p>
            <p><b>Metamorphic Conditions:</b> high temperature and low pressure, or low temperature and high pressure</p>
          </div>
        )
      },
      {
        shortName: "High Grade",
        name: "High Grade Metamorphic Rock",
        pattern: METAMORPHIC_HIGH_GRADE,
        diagram: <HighGradeMetamorphicRockDiagram />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> deep subduction zone, deep collision boundaries</p>
            <p><b>Origin Rock:</b> any</p>
            <p><b>Metamorphic Conditions:</b> high temperature and high pressure</p>
          </div>
        )
      }
    ]
  },
  {
    title: "Sedimentary Rocks",
    mainColor: SEDIMENTARY_YELLOW,
    lightColor: SEDIMENTARY_YELLOW_LIGHT,
    titleColor: SEDIMENTARY_TITLE_GRAY,
    rocks: [
      {
        name: "Sandstone",
        pattern: SandstonePatternSrc,
        image: <SandstoneImage />,
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
        image: <ShaleImage />,
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
        image: <LimestoneImage />,
        diagram: <LimestoneDiagram />,
        notes: (
          <div>
            <p><b>Depositional Environment:</b> underwater</p>
            <p><b>Origin Material:</b> organic deposits</p>
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
        shortName: "Oceanic",
        name: "Oceanic Sediments",
        pattern: OceanicSedimentPatternSrc,
        image: <OceanicSedimentsImage />,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> many</p>
            <p><b>Origin :</b> sea life, continental rocks, space dust</p>
          </div>
        )
      },
      {
        shortName: "Continental",
        name: "Continental Sediments",
        pattern: ContinentalSedimentPatternSrc, //TODO need the real pattern link
        image: <ContinentalSedimentsImage />,
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
        shortName: "Silica-rich",
        name: "Silica-rich Magma",
        pattern: MAGMA_SILICA_RICH,
        image: <MagmaImage />,
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
        shortName: "Intermediate",
        name: "Intermediate Magma",
        pattern: MAGMA_INTERMEDIATE,
        image: <MagmaImage />,
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
        shortName: "Iron-rich",
        name: "Iron-rich Magma",
        pattern: MAGMA_IRON_RICH,
        image: <MagmaImage />,
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
        pattern: `linear-gradient(to bottom, ${SKY_COLOR_1}, ${SKY_COLOR_2})`
      },
      {
        name: "Ocean",
        pattern: OCEAN_COLOR
      }
    ]
  }
];

const GEODEKey: IContainerDef[] = [
  {
    title: "Crust Types",
    mainColor: CRUST_TYPE,
    lightColor: CRUST_TYPE_LIGHT,
    rocks: [
      {
        shortName: "Oceanic",
        pattern: OCEANIC_CRUST_COLOR
      },
      {
        shortName: "Continental",
        pattern: CONTINENTAL_CRUST_COLOR
      }
    ]
  },
  {
    title: "Mantle Rocks",
    mainColor: MANTLE_PURPLE,
    lightColor: MANTLE_PURPLE_LIGHT,
    rocks: [
      {
        shortName: "Mantle (brittle)",
        pattern: MANTLE_BRITTLE
      },
      {
        shortName: "Mantle (ductile)",
        pattern: MANTLE_DUCTILE
      }
    ]
  },
  {
    title: "Magma",
    mainColor: MAGMA_RED,
    lightColor: MAGMA_RED_LIGHT,
    rocks: [
      {
        shortName: "Magma",
        pattern: MAGMA_INTERMEDIATE
      }
    ]
  },
  {
    title: "Other",
    mainColor: OTHER_GRAY,
    lightColor: OTHER_GRAY_LIGHT,
    rocks: [
      {
        shortName: "Sky",
        pattern: `linear-gradient(to bottom, ${SKY_COLOR_1}, ${SKY_COLOR_2})`
      },
      {
        shortName: "Ocean",
        pattern: OCEAN_COLOR
      }
    ]
  }
];

interface ITakeSampleBadgeProps {
  backgroundColor: string;
  borderColor: string;
  isSelected: boolean;
}
const TakeSampleBadge: React.FC<ITakeSampleBadgeProps> = ({ backgroundColor, borderColor, isSelected }) => {
  const style = { backgroundColor, borderColor };
  return (
    <div className={`${css.rockPickerTool} ${isSelected ? css.selected: ""}`} style={style}>
      <TakeSampleIcon />
    </div>
  );
};


interface IContainerProps extends IContainerDef {
  selectedRock?: string | null;
  onRockClick: (rock?: string | null) => void;
  flash: boolean;
}

const Container = (props: IContainerProps) => {
  const { title, mainColor, lightColor, titleColor, rocks, selectedRock, onRockClick, flash } = props;
  const midIndex = Math.ceil(rocks.length * 0.5);
  const firstColumn = rocks.slice(0, midIndex);
  const secondColumn = rocks.slice(midIndex);
  const selectedRockDef = selectedRock ? rocks.find(rock => rock.name === selectedRock) : undefined;
  const Rock = (rock: IRockProps) => {
    const isSelected = selectedRock === rock.name;
    const handleClick = () => rock.name && rock.onRockClick?.(isSelected ? null : rock.name);
    return (
      <div className={`${css.rock} ${rock.name ? css.selectable : ""}`} key={rock.name} onClick={handleClick}>
        <TakeSampleBadge backgroundColor={lightColor} borderColor={mainColor} isSelected={selectedRock === rock.name} />
        <div className={`${css.flashContainer} ${flash && isSelected ? css.flash : ""}`}>
          <div className={`${css.patternContainer} ${selectedRock === rock.name ? css.selected: ""}`} style={{ borderColor: mainColor }}>
            { (rock.pattern).includes("png")
              ? <img src={rock.pattern} />
              : <div className={css.patternIcon} style={{ background: rock.pattern }} />
            }
          </div>
          { rock.shortName || rock.name }
        </div>
      </div>
    );
  };

  return (
    <div className={css.container} style={{ borderColor: mainColor }}>
      <div className={css.header} style={{ backgroundColor: mainColor }}>
        <div className={css.headerLabel} style={{ color: titleColor }}>{ title }</div>
      </div>
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
          selectedRockDef?.notes &&
          <div className={`${css.expanded} ${flash ? css.flash : ""}`} style={{ backgroundColor: lightColor }}>
            <div className={css.separator} style={{ backgroundColor: mainColor, borderColor: mainColor }} />
            <div className={css.selectedRockTitle}>{ selectedRockDef.name }</div>
            { selectedRockDef.image }
            { selectedRockDef.diagram && <div className={css.selectedRockDiagram}>{ selectedRockDef.diagram }</div> }
            <div className={css.selectedRockNotes}>{ selectedRockDef.notes }</div>
          </div>
        }
      </div>
    </div>
  );
};

interface IState {

}

@inject("simulationStore")
@observer
export class RockTypes extends BaseComponent<IBaseProps, IState> {
  render() {
    const { selectedRock, setSelectedRock, selectedRockFlash, setSelectedRockFlash } = this.simulationStore;
    if (selectedRockFlash) {
      setTimeout(() => {
        setSelectedRockFlash(false);
      }, FLASH_ANIMATION_DURATION);
    }
    return (
      <div className={css.rockKey}>
        <div className={css.title}>Key: { config.geode ? "Cross-section" : "Rock Types" }</div>
        {
          (config.geode ? GEODEKey : TecRockKey).map((container, idx) =>
            <Container key={idx} {...container} selectedRock={selectedRock} onRockClick={setSelectedRock} flash={selectedRockFlash} />
          )
        }
      </div>
    );
  }
}