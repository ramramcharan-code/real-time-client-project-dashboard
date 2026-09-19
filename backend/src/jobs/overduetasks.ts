import cron from "node-cron";
import prisma from "../lib/prism";
import { getIO } from "../socket";

export const startOverdueTaskJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: {
            lt: now,
          },
          status: {
            not: "DONE",
          },
        },
      });

      for (const task of overdueTasks) {
        const existingNotification =
          await prisma.notification.findFirst({
            where: {
              userId: task.developerId,
              message: `Task "${task.title}" is overdue.`,
            },
          });
          const io = getIO();

io.emit("newNotification", {
  userId: task.developerId,
  message: `Task "${task.title}" is overdue.`,
});

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: task.developerId,
              message: `Task "${task.title}" is overdue.`,
            },
          });
          const io = getIO();

io.emit("newNotification", {
  userId: task.developerId,
  message: `Task "${task.title}" is overdue.`,
});


          console.log(
            `⏰ Overdue notification created for: ${task.title}`
          );
        }
      }
    } catch (error) {
      console.error("Overdue task job error:", error);
    }
  });

  console.log("⏰ Overdue task job started");
};