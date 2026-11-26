# Live stream reference

Read this when writing `defineLiveStream` options: `onSubscribe`, `identifyConnection`, or limits.

## onSubscribe by topic

```ts
export const live = defineLiveStream({
  id: 'app',
  async onSubscribe(ctx) {
    const post = /^post:(.+)$/.exec(ctx.topic);
    if (post && (await canReadPost(ctx.env, ctx.user, post[1]))) return;
    const inbox = /^user:(.+):inbox$/.exec(ctx.topic);
    if (inbox && ctx.owner === `user:${inbox[1]}`) return;
    return new Response('Forbidden', { status: 403 });
  },
});
```

Return nothing to allow, a `Response` to reject. Deny by default: end with the 403.

## identifyConnection

```ts
defineLiveStream({
  id: 'app',
  async identifyConnection(ctx) {
    const session = await getSession(ctx.request);
    return session ? `user:${session.userId}` : null;
  },
});
```

`null` or `undefined` falls back to the signed-in Void user (`user:${user.id}` when `id` is a string). With no owner and no `allowAnonymousControl` the request is rejected with 403.

## Limits

```ts
defineLiveStream({ id: 'app', limits: { maxSubscriptionsPerTopic: 64 } });
```
