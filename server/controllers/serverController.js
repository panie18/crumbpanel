const db = require('../models'); // Adjust the path as necessary

exports.createServer = async (req, res) => {
    try {
        const { name, type, memory, cpu, port } = req.body;
        const userId = req.user.id;

        if (!name || !type || !memory || !cpu) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Basic validation for resources
        if (memory < 512 || cpu < 1) {
             return res.status(400).json({ message: 'Invalid resource allocation' });
        }

        const newServer = await db.Server.create({
            name,
            type,
            memory,
            cpu,
            port: port || 25565, // Default port if not provided
            ownerId: userId,
            status: 'installing' // Initial status
        });

        // Trigger background installation process here (mocked for now)
        // installServer(newServer.id, type); 

        res.status(201).json({ message: 'Server created successfully', server: newServer });
    } catch (error) {
        console.error('Create server error:', error);
        res.status(500).json({ message: 'Failed to create server', error: error.message });
    }
};