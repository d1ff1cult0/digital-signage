import DisplayClient from "./DisplayClient";

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ screenId: string }>;
}) {
  const { screenId } = await params;
  return <DisplayClient screenId={screenId} />;
}
