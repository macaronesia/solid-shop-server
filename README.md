# solid-shop-server

A **GraphQL**-powered server used for 3D viewer applications, built with **Apollo Server** and **Sequelize**, including CRUD operations, subscription, authentication, pagination, and more.</br>

It is front-end agnostic. Prebuilt **[front-end](https://github.com/macaronesia/solid-shop-front)** and **[dashboard](https://github.com/macaronesia/solid-shop-admin)** are also provided.

## Getting Started

1. **Install dependencies**

    ```bash
    $ yarn
    ```

2. **Set up the env file**

    Copy `.env.example` to `.env` then substitute the value of `JWT_SECRET` with yours.

3. **Migrate the database**

    ```bash
    $ yarn db:migrate
    ```

    If you want to quickly experience the app, you can use the following seeding command instead
    ```bash
    $ yarn db:demo
    ```

4. **Start the server**

    ```bash
    $ yarn start
    ```

    The server is now running on [http://localhost:4000](http://localhost:4000). You can start the **[front-end](https://github.com/macaronesia/solid-shop-front)** and the **[dashboard](https://github.com/macaronesia/solid-shop-admin)** to experience this application.
