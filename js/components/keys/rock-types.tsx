import React, { useEffect, useRef } from "react";
import { inject, observer } from "mobx-react";
import { BaseComponent, IBaseProps } from "../base";
import {
  AndesiteImage, BasaltImage, ContinentalSedimentsImage, DioriteImage, GabbroImage, GraniteImage, LimestoneImage,
  MagmaImage, MantleImage, OceanicSedimentsImage, RhyoliteImage, SandstoneImage, ShaleImage
} from "./rock-images";
import { IGNEOUS_PURPLE, MANTLE_PURPLE, METAMORPHIC_GREEN, SEDIMENTARY_YELLOW, SEDIMENTS_ORANGE, MAGMA_RED,
  IGNEOUS_PURPLE_LIGHT, MANTLE_PURPLE_LIGHT, METAMORPHIC_GREEN_LIGHT, SEDIMENTARY_YELLOW_LIGHT, SEDIMENTS_ORANGE_LIGHT,
  MAGMA_RED_LIGHT, OTHER_GRAY, OTHER_GRAY_LIGHT, SEDIMENTARY_TITLE_GRAY, CRUST_TYPE, CRUST_TYPE_LIGHT } from "../../colors/rock-colors";
import { CONTINENTAL_CRUST_COLOR,
  OCEANIC_CRUST_COLOR } from "../../colors/cross-section-colors";
import { dataSampleInfo } from "../../shared";
import TakeSampleIcon from "../../../images/take-sample-icon.svg";
import { RockKeyLabel } from "../../types";
import config from "../../config";

import css from "../../../css-modules/keys/rock-types.less";

// This value has to equal to sum of @animationDuration and @animationDelay defined in rock-types.less
const FLASH_ANIMATION_DURATION = 750;

interface IRockDef {
  name?: RockKeyLabel;
  shortName?: string; // if different than full name
  pattern?: JSX.Element;
  image?: JSX.Element;
  diagram?: JSX.Element;
  notes?: JSX.Element;
  oneOf?: Omit<IRockDef, "oneOf">[];
}

interface IRockProps {
  onRockClick?: (rock: string | null) => void;
  rock: IRockDef;
}

interface IContainerDef {
  title: string;
  mainColor: string;
  lightColor: string;
  titleColor?: string;  // defaults to white
  rocks: IRockDef[];
  sediments?: boolean;
}

const TecRockKey: IContainerDef[] = [
  {
    title: "Igneous Rocks",
    mainColor: IGNEOUS_PURPLE,
    lightColor: IGNEOUS_PURPLE_LIGHT,
    rocks: [
      {
        name: "Gabbro",
        pattern: dataSampleInfo.Gabbro.pattern,
        image: <GabbroImage />,
        diagram: (
          <>
            { dataSampleInfo.Gabbro.ironContent }
            { dataSampleInfo.Gabbro.cooling }
          </>
        ),
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
        pattern: dataSampleInfo.Basalt.pattern,
        image: <BasaltImage />,
        diagram: (
          <>
            { dataSampleInfo.Basalt.ironContent }
            { dataSampleInfo.Basalt.cooling }
          </>
        ),
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
        pattern: dataSampleInfo.Diorite.pattern,
        image: <DioriteImage />,
        diagram: (
          <>
            { dataSampleInfo.Diorite.ironContent }
            { dataSampleInfo.Diorite.cooling }
          </>
        ),
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
        pattern: dataSampleInfo.Andesite.pattern,
        image: <AndesiteImage />,
        diagram: (
          <>
            { dataSampleInfo.Andesite.ironContent }
            { dataSampleInfo.Andesite.cooling }
          </>
        ),
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
        pattern: dataSampleInfo.Granite.pattern,
        image: <GraniteImage />,
        diagram: (
          <>
            { dataSampleInfo.Granite.ironContent }
            { dataSampleInfo.Granite.cooling }
          </>
        ),
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
        pattern: dataSampleInfo.Rhyolite.pattern,
        image: <RhyoliteImage />,
        diagram: (
          <>
            { dataSampleInfo.Rhyolite.ironContent }
            { dataSampleInfo.Rhyolite.cooling }
          </>
        ),
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
        pattern: dataSampleInfo["Mantle (brittle)"].pattern,
        image: <MantleImage />,
        diagram: dataSampleInfo["Mantle (brittle)"].ironContent,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> below the crust</p>
          </div>
        )
      },
      {
        name: "Mantle (ductile)",
        pattern: dataSampleInfo["Mantle (ductile)"].pattern,
        image: <MantleImage />,
        diagram: dataSampleInfo["Mantle (ductile)"].ironContent,
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
        oneOf: [
          {
            shortName: "Low Grade",
            name: "Low Grade Metamorphic Rock (Continental Collision)",
            pattern: dataSampleInfo["Low Grade Metamorphic Rock (Continental Collision)"].pattern,
            diagram: dataSampleInfo["Low Grade Metamorphic Rock (Continental Collision)"].metamorphicGrade,
            notes: (
              <div>
                <p><b>Tectonic Environment:</b> convergent boundary</p>
                <p><b>Origin Rock:</b> any</p>
                <p><b>Metamorphic Conditions:</b> low temperature and low pressure</p>
              </div>
            )
          },
          {
            shortName: "Low Grade",
            name: "Low Grade Metamorphic Rock (Subduction Zone)",
            pattern: dataSampleInfo["Low Grade Metamorphic Rock (Subduction Zone)"].pattern,
            diagram: dataSampleInfo["Low Grade Metamorphic Rock (Subduction Zone)"].metamorphicGrade,
            notes: (
              <div>
                <p><b>Tectonic Environment:</b> convergent boundary</p>
                <p><b>Origin Rock:</b> any</p>
                <p><b>Metamorphic Conditions:</b> low temperature and low pressure</p>
              </div>
            )
          }
        ]
      },
      {
        oneOf: [
          {
            shortName: "Medium Grade",
            name: "Medium Grade Metamorphic Rock (Continental Collision)",
            pattern: dataSampleInfo["Medium Grade Metamorphic Rock (Continental Collision)"].pattern,
            diagram: dataSampleInfo["Medium Grade Metamorphic Rock (Continental Collision)"].metamorphicGrade,
            notes: (
              <div>
                <p><b>Tectonic Environment:</b> convergent boundary</p>
                <p><b>Origin Rock:</b> any</p>
                <p><b>Metamorphic Conditions:</b> medium temperature and medium pressure</p>
              </div>
            )
          },
          {
            shortName: "Medium Grade",
            name: "Medium Grade Metamorphic Rock (Subduction Zone)",
            pattern: dataSampleInfo["Medium Grade Metamorphic Rock (Subduction Zone)"].pattern,
            diagram: dataSampleInfo["Medium Grade Metamorphic Rock (Subduction Zone)"].metamorphicGrade,
            notes: (
              <div>
                <p><b>Tectonic Environment:</b> convergent boundary</p>
                <p><b>Origin Rock:</b> any</p>
                <p><b>Metamorphic Conditions:</b> low temperature, medium pressure</p>
              </div>
            )
          },
        ]
      },
      {
        oneOf: [
          {
            shortName: "High Grade",
            name: "High Grade Metamorphic Rock (Continental Collision)",
            pattern: dataSampleInfo["High Grade Metamorphic Rock (Continental Collision)"].pattern,
            diagram: dataSampleInfo["High Grade Metamorphic Rock (Continental Collision)"].metamorphicGrade,
            notes: (
              <div>
                <p><b>Tectonic Environment:</b> convergent boundary</p>
                <p><b>Origin Rock:</b> any</p>
                <p><b>Metamorphic Conditions:</b> high temperature and high pressure</p>
              </div>
            )
          },
          {
            shortName: "High Grade",
            name: "High Grade Metamorphic Rock (Subduction Zone)",
            pattern: dataSampleInfo["High Grade Metamorphic Rock (Subduction Zone)"].pattern,
            diagram: dataSampleInfo["High Grade Metamorphic Rock (Subduction Zone)"].metamorphicGrade,
            notes: (
              <div>
                <p><b>Tectonic Environment:</b> convergent boundary,</p>
                <p><b>Origin Rock:</b> any</p>
                <p><b>Metamorphic Conditions:</b> low temperature, high pressure</p>
              </div>
            )
          }
        ]
      },
      {
        shortName: "Contact",
        name: "Contact Metamorphism",
        pattern: dataSampleInfo["Contact Metamorphism"].pattern,
        diagram: dataSampleInfo["Contact Metamorphism"].metamorphicGrade,
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> convergent boundary</p>
            <p><b>Origin Rock:</b> any</p>
            <p><b>Metamorphic Conditions:</b> high temperature, low pressure</p>
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
        pattern: dataSampleInfo.Sandstone.pattern,
        image: <SandstoneImage />,
        diagram: dataSampleInfo.Sandstone.particlesSize,
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
        pattern: dataSampleInfo.Shale.pattern,
        image: <ShaleImage />,
        diagram: dataSampleInfo.Shale.particlesSize,
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
        pattern: dataSampleInfo.Limestone.pattern,
        image: <LimestoneImage />,
        diagram: dataSampleInfo.Limestone.particlesSize,
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
    sediments: true,
    mainColor: SEDIMENTS_ORANGE,
    lightColor: SEDIMENTS_ORANGE_LIGHT,
    rocks: [
      {
        shortName: "Oceanic",
        name: "Oceanic Sediments",
        pattern: dataSampleInfo["Oceanic Sediments"].pattern,
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
        pattern: dataSampleInfo["Continental Sediments"].pattern,
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
        shortName: "Iron-poor",
        name: "Iron-poor Magma",
        pattern: dataSampleInfo["Iron-poor Magma"].pattern,
        image: <MagmaImage />,
        diagram: (
          <>
            { dataSampleInfo["Iron-poor Magma"].ironContent }
            { dataSampleInfo["Iron-poor Magma"].magmaTemperature }
          </>
        ),
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> continental volcanic arcs</p>
            <p><b>Composition:</b> about 4% iron, 75% silica, and 3% magnesium</p>
            <p><b>Origin Rock:</b> mantle rocks</p>
          </div>
        )
      },
      {
        shortName: "Intermediate",
        name: "Intermediate Magma",
        pattern: dataSampleInfo["Intermediate Magma"].pattern,
        image: <MagmaImage />,
        diagram: (
          <>
            { dataSampleInfo["Intermediate Magma"].ironContent }
            { dataSampleInfo["Intermediate Magma"].magmaTemperature }
          </>
        ),
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> volcanic island arcs</p>
            <p><b>Composition:</b> about 8% iron, 65% silica, and 6% magnesium</p>
            <p><b>Origin Rock:</b> mantle rocks</p>
          </div>
        )
      },
      {
        shortName: "Iron-rich",
        name: "Iron-rich Magma",
        pattern: dataSampleInfo["Iron-rich Magma"].pattern,
        image: <MagmaImage />,
        diagram: (
          <>
            { dataSampleInfo["Iron-rich Magma"].ironContent }
            { dataSampleInfo["Iron-rich Magma"].magmaTemperature }
          </>
        ),
        notes: (
          <div>
            <p><b>Tectonic Environment:</b> divergent boundaries, subduction zones</p>
            <p><b>Composition:</b> about 12% iron, 55% silica, and 9% magnesium</p>
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
        pattern: dataSampleInfo.Sky.pattern
      },
      {
        name: "Ocean",
        pattern: dataSampleInfo.Ocean.pattern
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
        pattern: <div style={{ background: OCEANIC_CRUST_COLOR, width: "20px", height: "20px" }} />
      },
      {
        shortName: "Continental",
        pattern: <div style={{ background: CONTINENTAL_CRUST_COLOR, width: "20px", height: "20px" }} />
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
        pattern: dataSampleInfo["Mantle (brittle)"].pattern
      },
      {
        shortName: "Mantle (ductile)",
        pattern: dataSampleInfo["Mantle (ductile)"].pattern
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
        pattern: dataSampleInfo["Intermediate Magma"].pattern
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
        pattern: dataSampleInfo.Sky.pattern
      },
      {
        shortName: "Ocean",
        pattern: dataSampleInfo.Ocean.pattern
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
  let selectedRockDef: IRockDef | undefined;
  rocks.forEach(rockDef => {
    if (rockDef.oneOf) {
      rockDef.oneOf.forEach((subRockDef: IRockDef) => {
        if (subRockDef.name === selectedRock) {
          selectedRockDef = subRockDef;
        }
      });
    } else if (rockDef.name === selectedRock) {
      selectedRockDef = rockDef;
    }
  });
  const container = useRef<HTMLDivElement>(null);

  const Rock = (rockProps: IRockProps) => {
    let rock = rockProps.rock;
    if (rock.oneOf) {
      rock = rock.oneOf.find(r => r.name === selectedRock) || rock.oneOf[0];
    }

    const isSelected = selectedRock === rock.name;
    const handleClick = () => rock.name && props.onRockClick?.(isSelected ? null : rock.name);

    return (
      <div className={`${css.rock} ${rock.name ? css.selectable : ""}`} key={rock.name} onClick={handleClick}>
        <TakeSampleBadge backgroundColor={lightColor} borderColor={mainColor} isSelected={selectedRock === rock.name} />
        <div className={`${css.flashContainer} ${flash && isSelected ? css.flash : ""}`}>
          <div className={`${css.patternContainer} ${selectedRock === rock.name ? css.selected: ""}`} style={{ borderColor: mainColor }}>
            { rock.pattern }
          </div>
          { rock.shortName || rock.name }
        </div>
      </div>
    );
  };

  useEffect(() => {
    // When there's any selected rock in this container, scroll it into view.
    if (selectedRockDef) {
      container.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedRockDef]);

  return (
    <div ref={container} className={css.container} style={{ borderColor: mainColor }}>
      <div className={css.header} style={{ backgroundColor: mainColor }}>
        <div className={css.headerLabel} style={{ color: titleColor }}>{ title }</div>
      </div>
      <div className={css.content}>
        <div className={css.column}>
          { firstColumn.map((rock, i) =>
            <Rock key={`${rock.name}-${i}`} rock={rock} onRockClick={onRockClick} />) }
        </div>
        <div className={css.column}>
          { secondColumn.map((rock, i) =>
            <Rock key={`${rock.name}-${i}`} rock={rock} onRockClick={onRockClick} />) }
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

interface IProps extends IBaseProps {
  showDivider: boolean;
}
interface IState {}

@inject("simulationStore")
@observer
export class RockTypes extends BaseComponent<IProps, IState> {
  render() {
    const { showDivider } = this.props;
    const { selectedRock, setSelectedRock, selectedRockFlash, setSelectedRockFlash, sediments } = this.simulationStore;
    if (selectedRockFlash) {
      setTimeout(() => {
        setSelectedRockFlash(false);
      }, FLASH_ANIMATION_DURATION);
    }
    return (
      <div className={`${css.rockKey} ${showDivider ? css.showDivider : ""}`}>
        { showDivider && <div className={css.keyDivider} /> }
        <div className={css.title}>Key: { config.geode ? "Cross-section" : "Rock Type" }</div>
        {
          (config.geode ? GEODEKey : TecRockKey).map((container, idx) =>
            // Don't include Sediments key when sediments rendering is disabled
            (sediments || !container.sediments) &&
            <Container key={`${container.title}-${idx}`} {...container}
              selectedRock={selectedRock} onRockClick={setSelectedRock} flash={selectedRockFlash} />
          )
        }
      </div>
    );
  }
}
