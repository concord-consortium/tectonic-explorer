import React, { useEffect, useRef, useState } from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";

import css from "../../css-modules/slider-switch.less";

interface IProps {
  label: string;
  isOn: boolean;
  onSet: (on: boolean) => void;
}
export const SliderSwitch: React.FC<IProps> = ({ label, isOn, onSet }) => {
  const kThumbOffPos = 0;
  const kThumbOnPos = 20;
  const [isDragging, setIsDragging] = useState(false);
  const totalDrag = useRef(0);
  const endDragTime = useRef(0);
  // position of the thumb; used with Draggable in controlled mode
  const [position, setPosition] = useState(isOn ? kThumbOnPos : kThumbOffPos);
  // restrict dragging to the range of movement of the thumb
  const dragBounds = { left: 0, top: 0, right: kThumbOnPos, bottom: 0 };

  const handleStart = (e: DraggableEvent, data: DraggableData) => {
    setIsDragging(true);
    totalDrag.current = 0;
  };
  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    setPosition(data.x);
    totalDrag.current += Math.abs(data.deltaX);
  };
  const handleStop = (e: DraggableEvent, data: DraggableData) => {
    setIsDragging(false);
    // must drag a few pixels to be considered a real drag
    if (totalDrag.current >= 3) {
      endDragTime.current = performance.now();
    }
    const isOnNow = data.x > (kThumbOffPos + kThumbOnPos) / 2;
    (isOn !== isOnNow) && onSet(isOnNow);
  };

  const handleClick = () => {
    // skip clicks immediately following drags; unfortunately, preventDefault() doesn't
    if (performance.now() - endDragTime.current > 100) {
      onSet(!isOn);
    }
  };
  useEffect(() => {
    // synchronize position at end of drag
    if (!isDragging) {
      const expectedPos = isOn ? kThumbOnPos : kThumbOffPos;
      (position !== expectedPos) && setPosition(expectedPos);
    }
  }, [isDragging, isOn, position]);

  const onClass = isOn ? "on" : "";
  return (
    <div className={css.sliderSwitch} onClick={handleClick}>
      <div className={`${css.track} ${onClass}`} />
      <Draggable axis="x" position={{ x: position, y: 0 }} bounds={dragBounds}
        onStart={handleStart} onDrag={handleDrag} onStop={handleStop}>
        <div className={`${css.thumbHighlight} ${onClass}`}>
          <div className={`${css.thumb} ${onClass}`}>
            <div className={`${css.thumbInterior} ${onClass}`}/>
          </div>
        </div>
      </Draggable>
      <label>{ label }</label>
    </div>
  );
};
