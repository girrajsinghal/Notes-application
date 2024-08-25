import { Router } from "express";
import {
  createNote,
  getNoteById,
  getAllNotes,
  updateNote,
  deleteNote,
} from "../controller/noteController.js";
const router = Router();

// Route to create a new note
router.post("/createnote", createNote);

//Route to get unique note
router.get("/getNoteById/:id", getNoteById);
// Route to get all notes
router.get("/getAllNotes", getAllNotes);

// Route to update a specific note by title
router.put("/updateNotes/:id", updateNote);

// Route to delete a specific note by title
router.delete("/deleteNotes/:id", deleteNote);

export default router;
