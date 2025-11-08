const supabase = require('../services/supabaseClient');

exports.sendMessage = async (req, res) => {
    try {
        const {
            userId,
            content,
            threadId: incomingThreadId
        } = req.body;

        if (!userId || !content) {
            return res.status(400).json({
                error: "userId and content are required"
            });
        }

        let threadId = incomingThreadId;

        // 1. Create new thread if threadId not provided
        if (!threadId) {
            const title = content.slice(0, 10);
            const {
                data: newThread,
                error: createThreadError
            } = await supabase
                .from("threads")
                .insert([{
                    user_id: userId,
                    title
                }])
                .select()
                .single();

            if (createThreadError) throw createThreadError;
            threadId = newThread.id;
        }

        // 2. Save user message
        const {
            data: userMessage,
            error: userMsgError
        } = await supabase
            .from("messages")
            .insert([{
                thread_id: threadId,
                role: "user",
                content
            }])
            .select()
            .single();

        if (userMsgError) throw userMsgError;

        // 3. Generate a dummy assistant reply
        const dummyReply = "Here is a multi-sentence simulated AI reply. Imagine this came from a real LLM service...";

        // 4. Save assistant reply
        const {
            data: assistantMessage,
            error: assistantMsgError
        } = await supabase
            .from("messages")
            .insert([{
                thread_id: threadId,
                role: "assistant",
                content: dummyReply
            }])
            .select()
            .single();

        if (assistantMsgError) throw assistantMsgError;

        // 5. Delay response by 10 seconds
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // 6. Return dummy reply to frontend
        res.json({
            reply: dummyReply,
            threadId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message || "Something went wrong"
        });
    }
};

// Get all threads for a user
exports.getThreads = async (req, res) => {
    try {
        const {
            userId
        } = req.query;
        if (!userId) {
            return res.status(400).json({
                error: "userId is required"
            });
        }

        const {
            data,
            error
        } = await supabase
            .from("threads")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", {
                ascending: false
            });

        if (error) throw error;

        res.json({
            threads: data || []
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message || "Something went wrong"
        });
    }
}

// Get all messages for a thread
exports.getMessages = async (req, res) => {
    try {
        const {
            threadId
        } = req.query;
        if (!threadId) {
            return res.status(400).json({
                error: "threadId is required"
            });
        }

        const {
            data,
            error
        } = await supabase
            .from("messages")
            .select("*")
            .eq("thread_id", threadId)
            .order("created_at", {
                ascending: true
            });

        if (error) throw error;

        res.json({
            messages: data || []
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message || "Something went wrong"
        });
    }
};