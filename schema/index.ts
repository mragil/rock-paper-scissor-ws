import { z } from "zod";

type Pick = "Rock" | "Paper" | "Scissor";

const gamePickSchema = z.custom<Pick>();

export { gamePickSchema };
