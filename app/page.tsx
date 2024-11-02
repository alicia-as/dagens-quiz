import IndexPage from "./components/IndexPage";

interface PageProps {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  const quizDate = searchParams.date as string | undefined;

  return <IndexPage quizDate={quizDate} />;
}
