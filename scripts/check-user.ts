import { prisma } from "../lib/prisma";
prisma.user.findMany({ where: { email: { contains: "Abhinav", mode: "insensitive" } } })
  .then(users => console.log("USERS:", users))
  .catch(console.error);

prisma.school.findMany({ where: { schoolCode: { contains: "901" } } })
  .then(s => console.log("SCHOOL:", s))
  .catch(console.error);
