import { useState, type ReactNode } from 'react';
import { type GestureResponderHandlers, type LayoutChangeEvent, PanResponder, View } from 'react-native';

function DragHandleCapture({
  index,
  onDragStart,
  onDragMove,
  onDragEnd,
  children,
}: {
  index: number;
  onDragStart: (index: number, pos: { x: number; y: number }) => void;
  onDragMove: (pos: { x: number; y: number }) => void;
  onDragEnd: () => void;
  children: (handlers: GestureResponderHandlers) => ReactNode;
}) {
  // gestureState.dy/x0/y0 aren't reliable for mouse-driven drags on react-native-web,
  // so the offset is derived from the raw event's pageX/pageY instead.
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => onDragStart(index, { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY }),
    onPanResponderMove: (evt) => onDragMove({ x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY }),
    onPanResponderRelease: onDragEnd,
    onPanResponderTerminate: onDragEnd,
  });

  return <>{children(panResponder.panHandlers)}</>;
}

export function DraggableList<T>({
  items,
  keyExtractor,
  onReorder,
  renderItem,
  onDragStart,
  onBeforeDrop,
}: {
  items: T[];
  keyExtractor: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (params: {
    item: T;
    isDragging: boolean;
    dragHandleProps: GestureResponderHandlers;
  }) => ReactNode;
  /** Fires once when a drag begins, before any movement — useful for refreshing drop-target
   * measurements that live outside this list (e.g. cross-list drop zones). */
  onDragStart?: (item: T) => void;
  /** Checked at drag release, before the normal same-list reorder. Return true to signal the
   * drop was handled elsewhere (e.g. dropped onto an external drop zone) — this skips reordering. */
  onBeforeDrop?: (item: T, pagePos: { x: number; y: number }) => boolean;
}) {
  const [prevItems, setPrevItems] = useState(items);
  const [order, setOrder] = useState(items);
  const [dragState, setDragState] = useState<{
    index: number;
    startY: number;
    dy: number;
    pageX: number;
    pageY: number;
  } | null>(null);
  const [itemHeight, setItemHeight] = useState(0);

  if (items !== prevItems) {
    setPrevItems(items);
    setOrder(items);
  }

  const hoverIndex =
    dragState === null
      ? null
      : Math.min(Math.max(dragState.index + Math.round(dragState.dy / (itemHeight || 1)), 0), order.length - 1);

  const handleRowLayout = (e: LayoutChangeEvent) => {
    if (itemHeight === 0) {
      setItemHeight(e.nativeEvent.layout.height);
    }
  };

  const handleDragEnd = () => {
    // onReorder must NOT be called from inside a setState updater (it's a side effect
    // that can update a different component's state) — read dragState/hoverIndex from
    // the render closure directly instead, then commit the two state changes separately.
    if (dragState) {
      const draggedItem = order[dragState.index];
      if (onBeforeDrop?.(draggedItem, { x: dragState.pageX, y: dragState.pageY })) {
        setDragState(null);
        return;
      }
    }
    if (dragState && hoverIndex !== null && hoverIndex !== dragState.index) {
      const next = [...order];
      const [moved] = next.splice(dragState.index, 1);
      next.splice(hoverIndex, 0, moved);
      setOrder(next);
      onReorder(next);
    }
    setDragState(null);
  };

  return (
    <View>
      {order.map((item, index) => {
        const isDragging = dragState?.index === index;
        let translateY = 0;
        if (dragState && !isDragging && hoverIndex !== null) {
          if (dragState.index < hoverIndex && index > dragState.index && index <= hoverIndex) {
            translateY = -itemHeight;
          } else if (dragState.index > hoverIndex && index < dragState.index && index >= hoverIndex) {
            translateY = itemHeight;
          }
        }
        const style = isDragging
          ? { transform: [{ translateY: dragState.dy }], zIndex: 10, elevation: 10 }
          : { transform: [{ translateY }] };

        return (
          <View key={keyExtractor(item)} style={style} onLayout={handleRowLayout}>
            <DragHandleCapture
              index={index}
              onDragStart={(i, pos) => {
                onDragStart?.(order[i]);
                setDragState({ index: i, startY: pos.y, dy: 0, pageX: pos.x, pageY: pos.y });
              }}
              onDragMove={(pos) =>
                setDragState((s) => (s ? { ...s, dy: pos.y - s.startY, pageX: pos.x, pageY: pos.y } : s))
              }
              onDragEnd={handleDragEnd}>
              {(dragHandleProps) => renderItem({ item, isDragging, dragHandleProps })}
            </DragHandleCapture>
          </View>
        );
      })}
    </View>
  );
}
