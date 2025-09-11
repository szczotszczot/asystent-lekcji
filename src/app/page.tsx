"use client";

import { useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Input,
  Stack,
  Text,
  Heading,
  chakra,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";

type Result = { ok: boolean; content?: string; message?: string };

export default function Home() {
  const [subject, setSubject] = useState("matematyka");
  const [grade, setGrade] = useState("7");
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState("45");
  const [result, setResult] = useState<Result | null>(null);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleGenerateStream() {
    setStreaming(true);
    setResult({ ok: true, content: "" });
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          subject,
          grade: parseInt(grade, 10),
          topic,
          minutes: parseInt(minutes, 10),
          conditions: [],
        }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setResult({ ok: true, content: full });
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setResult((prev) => prev ?? { ok: false, message: "Przerwano." });
      } else if (e instanceof Error) {
        setResult({ ok: false, message: e?.message ?? "Stream failed" });
      } else {
        setResult({ ok: false, message: "Stream failed (unknown error)" });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function cancelStream() {
    abortRef.current?.abort();
  }

  return (
    <Container py={10}>
      <Stack gap={6}>
        <Heading size="lg">Asystent Lekcji MEN</Heading>

        <Stack gap={4}>
          <Box>
            <Text mb={2}>Przedmiot</Text>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 8 }}
            >
              <option value="matematyka">Matematyka</option>
              <option value="fizyka">Fizyka</option>
              <option value="geografia">Geografia</option>
              <option value="informatyka">Informatyka</option>
            </select>
          </Box>

          <Box>
            <Text mb={2}>Klasa</Text>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 8 }}
            >
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
            </select>
          </Box>

          <Box>
            <Text mb={2}>Temat lekcji</Text>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Np. Potęgi i pierwiastki"
            />
          </Box>

          <Box>
            <Text mb={2}>Czas (minuty)</Text>
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </Box>

          <Stack direction={{ base: "column", md: "row" }} gap={3}>
            <Button
              loading={streaming}
              loadingText="Strumieniuję..."
              onClick={handleGenerateStream}
              colorPalette="green"
            >
              Generuj (stream)
            </Button>

            {streaming && (
              <Button variant="outline" onClick={cancelStream}>
                Przerwij
              </Button>
            )}
          </Stack>
        </Stack>

        {result && (
          <Box borderWidth="1px" borderRadius="xl" p={4}>
            {result.ok ? (
              <Box
                p={4}
                borderWidth="1px"
                borderRadius="lg"
                bg="gray.50"
                css={{
                  "& h1": {
                    fontSize: "var(--chakra-font-sizes-2xl)",
                    fontWeight: 700,
                    marginBottom: "0.75rem",
                  },
                  "& h2": {
                    fontSize: "var(--chakra-font-sizes-xl)",
                    fontWeight: 600,
                    marginTop: "1rem",
                    marginBottom: "0.5rem",
                  },
                  "& h3": {
                    fontSize: "var(--chakra-font-sizes-lg)",
                    fontWeight: 600,
                    marginTop: "0.75rem",
                    marginBottom: "0.5rem",
                  },
                  "& p": { marginBottom: "0.5rem" },
                  "& ul": {
                    paddingLeft: "1.5rem",
                    marginBottom: "0.5rem",
                    listStyle: "disc",
                  },
                  "& ol": {
                    paddingLeft: "1.5rem",
                    marginBottom: "0.5rem",
                    listStyle: "decimal",
                  },
                  "& li": { marginBottom: "0.25rem" },
                  "& strong": { fontWeight: 700 },
                }}
              >
                <ReactMarkdown
                  components={{
                    h1: (props) => (
                      <Heading as="h1" size="xl" mb={3} {...props} />
                    ),
                    h2: (props) => (
                      <Heading as="h2" size="lg" mt={4} mb={2} {...props} />
                    ),
                    h3: (props) => (
                      <Heading as="h3" size="md" mt={3} mb={2} {...props} />
                    ),
                    p: (props) => <Text as="p" mb={2} {...props} />,
                    ul: (props) => <ul {...props} />,
                    ol: (props) => <ol {...props} />,
                    li: (props) => <li {...props} />,
                    strong: (props) => (
                      <chakra.strong fontWeight="bold" {...props} />
                    ),
                  }}
                >
                  {result.content ?? ""}
                </ReactMarkdown>
              </Box>
            ) : (
              <Box>{result.message}</Box>
            )}
          </Box>
        )}
      </Stack>
    </Container>
  );
}
