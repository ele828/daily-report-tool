# daily-report-tool

The prototype of daily report tool, which is born for aggregating and reporting daily github commits.

## Config your env

You can configure env like this.

```typescript
export let env = {
  email: {
    account: "your-email-address@gmail.com",
    password: "Your email password",
    to: "report-email-address@gmail.com"
  }
};
```

## Config your account

You can configure github account like this.

```ts
export let account = {
  username: "Your github username",
  password: 'Your github password'
};
```

## Install & deploy
Before continue, you have to install `yarn` first by *Homebrew* or other [ways](https://yarnpkg.com/lang/en/docs/install/#mac-stable).

1. install [typescript], `yarn global add typescript`.
2. install nodemon, `yarn global add nodemon`.
3. install ts-node for development.

Run `npm run build` to buld, run `npm run dev` for development, and run `npm run prod` to build and run this project in server.

## TODO:
- [ ] Add necessary types