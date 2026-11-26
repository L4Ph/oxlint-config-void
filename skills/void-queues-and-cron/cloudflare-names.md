# Adopting Worker-prefixed queue names (direct Cloudflare)

Read this when a direct Cloudflare deployment already has queues named without the Worker name and you redeploy with Void's `<worker-name>-<queue>` naming. Existing deployments keep their old queues and messages until you move.

1. Pause the producers (stop code paths that call `queues.<name>.send()`).
2. Drain the old queue: let its consumer process what remains. Check that it reports empty.
3. In Cloudflare, remove the old queue's Worker consumer.
4. Redeploy; Void creates the prefixed queue and attaches the consumer.
5. Delete the old queue only when it is empty. Deleting it with messages inside destroys them.
6. Resume producers.

Done when the new queue shows the consumer attached, the old queue is gone or empty, and a test message reaches the consumer.
