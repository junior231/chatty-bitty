import Head from "next/head";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";

export default function Home() {
  const { user, isLoading, error } = useUser();

  if (isLoading) return <div>...Loading</div>;

  if (error) return <div>{error.message}</div>;

  return (
    <>
      <Head>
        <title>Chatty Bitty - Login or Signup</title>
      </Head>

      <div className="flex min-h-screen w-full items-center justify-center bg-gray-800 text-center text-white">
        <div>
          {/* if user exists render logout button else show login button */}
          {!!user && <Link href="/api/auth/logout">Logout</Link>}
          {!user && (
            <>
              <Link
                href="/api/auth/login"
                className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
              >
                Login
              </Link>
              <Link
                className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
                href="/api/auth/signup"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = async (context) => {
  // get req and res from context provided by getServersideProps
  const { req, res } = context;
  const session = await getSession(req, res);

  // if user is logged in, redirect to chat page
  if (!!session) {
    return {
      redirect: {
        destination: "/chat",
      },
    };
  }

  return {
    props: {},
  };
};
