import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface PluginConfig {
  id: string;
  name: string;
  enabled: boolean;
}

function SortablePluginItem({
  plugin,
  onToggle,
}: {
  plugin: PluginConfig;
  onToggle: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: plugin.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onToggle(plugin.id)}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md bg-card cursor-pointer",
        "border border-transparent",
        isDragging && "opacity-50 border-border"
      )}
    >
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span
        className={cn(
          "flex-1 text-sm",
          !plugin.enabled && "text-muted-foreground"
        )}
      >
        {plugin.name}
      </span>

      <span onClick={(e) => e.stopPropagation()}>
        <Checkbox
          key={`${plugin.id}-${plugin.enabled}`}
          checked={plugin.enabled}
          onCheckedChange={() => onToggle(plugin.id)}
        />
      </span>
    </div>
  );
}

interface PluginsSectionProps {
  plugins: PluginConfig[];
  onReorder: (orderedIds: string[]) => void;
  onToggle: (id: string) => void;
}

export function PluginsSection({ plugins, onReorder, onToggle }: PluginsSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = plugins.findIndex((item) => item.id === active.id);
      const newIndex = plugins.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(plugins, oldIndex, newIndex);
      onReorder(next.map((item) => item.id));
    }
  };

  return (
    <section>
      <h3 className="text-lg font-semibold mb-0">Plugins</h3>
      <p className="text-sm text-muted-foreground mb-2">
        Your AI coding lineup
      </p>
      <div className="bg-muted/50 rounded-lg p-1 space-y-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={plugins.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {plugins.map((plugin) => (
              <SortablePluginItem
                key={plugin.id}
                plugin={plugin}
                onToggle={onToggle}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}