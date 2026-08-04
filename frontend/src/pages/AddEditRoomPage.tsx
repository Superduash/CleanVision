import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useRoom } from "@/hooks/useRooms";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

const schema = z.object({
  name: z
    .string()
    .min(1, "Room name is required")
    .max(100, "Room name must be 100 characters or fewer"),
  block: z.string().min(1, "Block / ward is required"),
});

type FormValues = z.infer<typeof schema>;

export function AddEditRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const isEdit = Boolean(roomId);
  const id = Number(roomId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: room, isLoading } = useRoom(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Pre-fill form on edit
  useEffect(() => {
    if (room) {
      reset({ name: room.name, block: room.block });
    }
  }, [room, reset]);

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.createRoom(values),
    onSuccess: (data) => {
      toast.success("Room added. Upload a baseline photo to start scanning.");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      navigate(`/dashboard/rooms/${data.room_id}`);
    },
    onError: (err: Error) =>
      toast.error(err.message || "Couldn't add the room. Try again."),
  });

  const editMutation = useMutation({
    mutationFn: (values: FormValues) => api.updateRoom(id, values),
    onSuccess: (_data, variables) => {
      toast.success("Room updated successfully.");
      queryClient.setQueryData(
        ["room", id],
        (old: { room: typeof room } | undefined) =>
          old ? { room: { ...old.room, ...variables } } : old,
      );
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate(`/dashboard/rooms/${id}`);
    },
    onError: (err: Error) =>
      toast.error(err.message || "Couldn't update the room. Try again."),
  });

  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      editMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || editMutation.isPending;

  return (
    <div className="mx-auto max-w-lg px-6 py-8 page-enter">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="rounded-lg p-2 text-text-muted hover:bg-bg hover:text-text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {isEdit ? "Edit room" : "Add room"}
          </h1>
          <p className="text-sm text-text-muted">
            {isEdit
              ? "Update this room's name or block."
              : "Register a new room to start tracking cleanliness."}
          </p>
        </div>
      </div>

      {isLoading && isEdit ? (
        <div className="mt-8 space-y-4">
          <div className="h-16 skeleton rounded-lg" />
          <div className="h-16 skeleton rounded-lg" />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 flex flex-col gap-5"
          noValidate
        >
          <Input
            label="Room name"
            placeholder="e.g. Room 204"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Block / Ward"
            placeholder="e.g. Block A"
            error={errors.block?.message}
            {...register("block")}
          />


          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => navigate(-1)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending} className="flex-1">
              {isEdit ? "Save changes" : "Add room"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
