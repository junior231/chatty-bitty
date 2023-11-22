import Head from "next/head";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

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
          <div>
            <FontAwesomeIcon
              icon={faRobot}
              className="mb-2 text-6xl text-emerald-200"
            />
          </div>
          <h1 className="text-4xl font-bold">Welcome to Chatty Bitty</h1>
          <p className="mt-2 text-lg">Log in with your account to continue</p>
          <div className="mt-4 flex justify-center gap-3">
            {/* if user exists render logout button else show login button */}
            {!user && (
              <>
                <Link href="/api/auth/login" className="btn">
                  Login
                </Link>
                <Link className="btn" href="/api/auth/signup">
                  Sign Up
                </Link>
              </>
            )}
          </div>
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
