"use client";

import Swal from "sweetalert2";

type StatusAction = (formData: FormData) => Promise<void>;

const CONFIRM_MESSAGES: Record<string, { title: string; text: string; icon?: "warning" | "question" }> = {
  COMPLETED: { title: "Mark as completed?", text: "This project will be marked as completed. No new expenses can be added.", icon: "question" },
  ON_HOLD: { title: "Put on hold?", text: "This project will be put on hold. You can still add expenses.", icon: "question" },
  CANCELLED: { title: "Cancel project?", text: "This project will be cancelled. No new expenses can be added. You can reactivate it later.", icon: "warning" },
  ACTIVE: { title: "Reactivate project?", text: "This project will be set back to active.", icon: "question" },
};

export function ProjectStatusButton({
  action,
  projectId,
  status,
  label,
  className,
}: {
  action: StatusAction;
  projectId: string;
  status: string;
  label: string;
  className?: string;
}) {
  const handleClick = async () => {
    const config = CONFIRM_MESSAGES[status] ?? { title: "Confirm", text: `Update status to ${label}?`, icon: "question" as const };
    const result = await Swal.fire({
      title: config.title,
      text: config.text,
      icon: config.icon ?? "question",
      showCancelButton: true,
      confirmButtonColor: status === "CANCELLED" ? "#dc2626" : "#0d9488",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, continue",
    });
    if (result.isConfirmed) {
      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("status", status);
      await action(formData);
      await Swal.fire({
        title: "Done",
        text: "Status updated successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {label}
    </button>
  );
}
