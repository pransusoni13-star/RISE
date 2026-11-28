import React from "react";
import Head from "expo-router/head";
import EntryScreen from "../components/entry-screen";

export default function WebHomeScreen() {
  return (
    <>
      <Head>
        <title>RISE — One small task. A little progress.</title>
        <meta
          name="description"
          content="Choose a goal and a few minutes. RISE gives you one practical task at a time. Free to start, with no account required. For ages 13 and older."
        />
      </Head>
      <EntryScreen />
    </>
  );
}
