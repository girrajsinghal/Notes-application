import Note from "../models/note.js";
import { client } from "../redisClient.js"; // Ensure the correct Redis client is imported

export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const existingNoteInMongoDB = await Note.findOne({ title: title });
    if (existingNoteInMongoDB) {
      return res
        .status(400)
        .json({ error: "A note with this title already exists" });
    }

    const cacheKey = "all_notes";
    const cachedNotes = await client.get(cacheKey);
    let notes = cachedNotes ? JSON.parse(cachedNotes) : [];

    const newNote = new Note({ title, content });
    await newNote.save();

    notes.push(newNote);
    await client.set(cacheKey, JSON.stringify(notes), { EX: 60 });

    return res.status(201).json({
      message: "Note created successfully",
      note: newNote,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create note" });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const noteId = req.params.id;
    const cacheKey = "all_notes";

    // Try to get the notes from Redis cache
    const cachedNotes = await client.get(cacheKey);

    if (cachedNotes) {
      const notes = JSON.parse(cachedNotes);
      const note = notes.find((note) => note._id === noteId);

      if (note) {
        return res.status(200).json(note);
      }
    }

    // If not found in cache, get it from MongoDB
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Update Redis with the new note data
    if (cachedNotes) {
      const notes = JSON.parse(cachedNotes);
      notes.push(note);
      await client.set(cacheKey, JSON.stringify(notes), { EX: 60 });
    } else {
      await client.set(cacheKey, JSON.stringify([note]), { EX: 60 });
    }

    return res.status(200).json(note);
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve note" });
  }
};

export const getAllNotes = async (req, res) => {
  try {
    const cacheKey = "all_notes";
    const cachedNotes = await client.get(cacheKey);

    if (cachedNotes) {
      return res.status(200).json(JSON.parse(cachedNotes));
    }
    const data = await Note.find();

    if (data) {
      // Store the retrieved notes in Redis
      await client.set(cacheKey, JSON.stringify(data), { EX: 60 });
      return res.status(200).json({ msg: "mongo", data });
    }

    // If there are no cached notes, return a 404 error
    return res.status(404).json({ error: "No notes found in cache" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve notes from db" });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const noteId = req.params.id;

    const cacheKey = "all_notes";

    // Fetch cached notes from Redis
    const cachedNotes = await client.get(cacheKey);
    let notes = cachedNotes ? JSON.parse(cachedNotes) : null;

    if (notes) {
      const noteIndex = notes.findIndex((note) => note._id === noteId);

      if (noteIndex !== -1) {
        // Update the note in the array
        notes[noteIndex] = { ...notes[noteIndex], title, content };

        await Note.findByIdAndUpdate(noteId, { title, content });

        // Persist updated notes array back to Redis with 60 seconds expiry
        await client.set(cacheKey, JSON.stringify(notes), { EX: 60 });

        return res.status(200).json({
          message: "Note updated successfully in Redis and MongoDB",
          note: notes[noteIndex],
        });
      }
    } else {
      // If note not found in Redis cache, fetch from MongoDB
      const updatedNote = await Note.findByIdAndUpdate(
        noteId,
        { title, content },
        { new: true }
      );

      if (!updatedNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      // If updated in MongoDB, fetch all notes and cache in Redis
      const allNotes = await Note.find();
      await client.set(cacheKey, JSON.stringify(allNotes), { EX: 60 });

      return res.status(200).json({
        message: "Note updated successfully in MongoDB, cached in Redis",
        note: updatedNote,
      });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to update note" });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const cacheKey = "all_notes";

    // Delete from Redis first
    const cachedNotes = await client.get(cacheKey);
    if (cachedNotes) {
      let notes = JSON.parse(cachedNotes);
      notes = notes.filter((note) => note._id !== noteId);
      await client.set(cacheKey, JSON.stringify(notes), { EX: 60 });
    }

    // Delete a data from MongoDB
    const deletedNote = await Note.findByIdAndDelete(noteId);

    if (!deletedNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete note" });
  }
};
