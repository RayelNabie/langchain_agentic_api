/**
 * @file Defines the /chat route and its OpenAPI documentation.
 *
 * @module http/chat/routes
 * @author RayelNabie
 */

import { Router } from 'express';
import { ChatController } from '#http/chat/ChatController.js';

const router: Router = Router();

/**
 * @openapi
 * /chat:
 *   post:
 *     summary: Ask the OpenAI LLM a question
 *     description: Sends a prompt to Azure OpenAI via LangChain and returns the response including metadata (such as token usage).
 *     tags:
 *       - AI Integration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "Explain in 2 sentences what the Bouncer Pattern is."
 *               stream:
 *                 type: boolean
 *                 description: Whether to stream the response using Server-Sent Events
 *                 example: false
 *               sessionId:
 *                 type: string
 *                 description: Unique identifier for the chat session to maintain history
 *                 example: "user-123-session-456"
 *     responses:
 *       200:
 *         description: Successfully generated response (JSON or Event Stream)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   example: "The Bouncer Pattern is a programming style..."
 *                 metadata:
 *                   type: object
 *                   description: Raw metadata from the LLM provider
 *                 usage:
 *                   type: object
 *                   description: Token usage information
 *                   properties:
 *                     input_tokens:
 *                       type: integer
 *                     output_tokens:
 *                       type: integer
 *                     total_tokens:
 *                       type: integer
 *           text/event-stream:
 *             description: Stream of events for real-time responses
 *             schema:
 *               type: string
 *               example: |
 *                 data: {"content":"The","metadata":{}}
 *
 *                 data: {"content":" Bouncer","metadata":{}}
 *
 *                 ...
 *                 event: end
 *                 data: [DONE]
 *       400:
 *         description: Bad Request (Prompt missing in the body)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "prompt cannot be empty"
 *       500:
 *         description: Internal Server Error (AI API down or network error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "AI Error"
 *                 details:
 *                   type: string
 *                   example: "Service connection timeout"
 */
router.post('/chat', ChatController.chat);

export default router;
