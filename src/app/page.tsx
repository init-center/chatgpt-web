"use client";

import { useTextareaAutoHeight } from "@/hooks/useTextareaAutoHeight";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@mui/material/Avatar";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import Button from "@mui/material/Button";
import Image from "next/image";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import TerminalOutlinedIcon from "@mui/icons-material/TerminalOutlined";
import { Card, CardContent, Popover, TextField, styled } from "@mui/material";
import { cyan, purple, yellow, red } from "@mui/material/colors";
import OpenAI from "openai";
import MarkdownIt from "markdown-it";
import { scrollToLastChild } from "@/utils";
import { useSnackbar } from "notistack";

type Message = {
  id: string;
  model: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type Messages = Message[];

// create a markdown parser
const mdi = new MarkdownIt({
  html: false,
  linkify: true,
});

const SmallAvatar = styled(Avatar)(() => ({
  width: 18,
  height: 18,
}));

const API_KEY_STORAGE_KEY = "API_KEY";

const isBrowser = typeof window !== "undefined";

export default function Home() {
  const [keyValue, setKeyValue] = useState(
    (isBrowser && localStorage.getItem(API_KEY_STORAGE_KEY)) || ""
  );
  const [apiKey, setApiKey] = useState(
    (isBrowser && localStorage.getItem(API_KEY_STORAGE_KEY)) || ""
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [submittable, setSubmittable] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState<Messages>([]);
  const messageBoxRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const { enqueueSnackbar } = useSnackbar();

  // create an OpenAI client
  const openAiClient = useMemo(() => {
    return new OpenAI({
      baseURL: process.env.NEXT_PUBLIC_BASE_URL,
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
  }, [apiKey]);

  // auto resize the prompt textarea
  useTextareaAutoHeight(promptTextareaRef, {
    minHeight: 28,
    padding: 4,
  });

  // check if the prompt is submittable
  useEffect(() => {
    const promptTextarea = promptTextareaRef.current;
    if (!promptTextarea) {
      return;
    }
    const listener = () => {
      setSubmittable(!!promptTextarea?.value.trim());
    };
    promptTextarea.addEventListener("input", listener);

    return () => {
      promptTextarea?.removeEventListener("input", listener);
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isChatting) {
      return;
    }
    const promptTextarea = promptTextareaRef.current;
    if (!promptTextarea) {
      return;
    }

    const prompt = promptTextarea.value.trim();
    if (!prompt) {
      return;
    }

    setIsChatting(true);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        model: process.env.NEXT_PUBLIC_MODEL_NAME,
        role: "user",
        content: prompt,
      },
    ]);

    setTimeout(() => {
      promptTextarea.value = "";
      // manually trigger the input event
      promptTextarea.dispatchEvent(new Event("input"));
    }, 0);

    messageBoxRef.current && scrollToLastChild(messageBoxRef.current);

    try {
      const stream = await openAiClient.chat.completions.create({
        model: process.env.NEXT_PUBLIC_MODEL_NAME,
        messages: [
          ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
          { role: "user", content: prompt },
        ],
        stream: true,
      });

      for await (const part of stream) {
        setMessages((prev) => {
          const existMsg = prev.find((msg) => msg.id === part.id);
          if (existMsg) {
            return prev.map((msg) =>
              msg.id === part.id
                ? {
                    ...msg,
                    role: "assistant",
                    content:
                      msg.content + (part.choices[0].delta.content || ""),
                  }
                : msg
            );
          } else {
            return [
              ...prev,
              {
                id: part.id,
                model: part.model,
                role: "assistant",
                content: part.choices[0].delta.content || "",
              },
            ] as Messages;
          }
        });
        const messageBox = messageBoxRef.current;
        if (!messageBox) {
          continue;
        }

        scrollToLastChild(messageBox);
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar(
        (error as any)?.error?.message ?? "发生错误，请稍后再试",
        {
          variant: "error",
        }
      );
    } finally {
      setIsChatting(false);
    }
  }, [enqueueSnackbar, isChatting, messages, openAiClient.chat.completions]);

  // change the textarea keydown event
  // let the textarea can press "Enter" to submit the prompt
  // and press "Shift + Enter" to insert a new line
  useEffect(() => {
    const promptTextarea = promptTextareaRef.current;
    if (!promptTextarea) {
      return;
    }

    const listener = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    promptTextarea.addEventListener("keydown", listener);

    return () => {
      promptTextarea.removeEventListener("keydown", listener);
    };
  }, [handleSubmit]);

  return (
    <div className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden">
      <div
        className="relative w-full flex-1 overflow-y-auto overflow-x-hidden @container/main"
        ref={messageBoxRef}
      >
        <div className="bg-white sticky top-0 left-0 z-10 flex h-[60px] p-2 items-center justify-center">
          <div
            ref={avatarRef}
            className="ml-auto cursor-pointer"
            onClick={() => setIsPopoverOpen(true)}
          >
            <Avatar alt="Avatar" src="https://picsum.photos/200" />
          </div>
          <Popover
            open={isPopoverOpen}
            anchorEl={avatarRef.current}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            onClose={() => setIsPopoverOpen(false)}
          >
            <div className="flex items-center justify-center gap-2 p-2">
              <TextField
                id="standard-basic"
                label="API Key"
                variant="standard"
                type="password"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => {
                  if (!keyValue) {
                    return;
                  }
                  setApiKey(keyValue);
                  localStorage.setItem(API_KEY_STORAGE_KEY, keyValue);
                  setIsPopoverOpen(false);
                  enqueueSnackbar("API Key 设置成功", {
                    variant: "success",
                  });
                }}
              >
                设置
              </Button>
            </div>
          </Popover>
        </div>

        {messages.length > 0 ? (
          messages.map((msg) => <MessageItem key={msg.id} msg={msg} />)
        ) : (
          <div className="flex flex-col h-[calc(100%-60px)] justify-center items-center">
            <div className="flex flex-col w-[60%] justify-center items-center @container/intro">
              <Image src="./chatgpt-6.svg" alt="logo" width="48" height="48" />
              <div className="flex mt-12 gap-4 flex-wrap justify-stretch">
                <div className="flex flex-1 gap-4 justify-center items-stretch flex-wrap @lg/intro:flex-nowrap">
                  <Card
                    className="rounded-xl w-[160px] cursor-pointer"
                    onClick={() => {
                      if (!promptTextareaRef.current) return;
                      promptTextareaRef.current.value =
                        "测试一下我的古代文明知识";
                      setTimeout(() => {
                        handleSubmit();
                      }, 0);
                    }}
                  >
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        <SchoolOutlinedIcon
                          sx={{ color: cyan[300], fontSize: 20 }}
                        />
                        <div className="text-[#676767] text-sm">
                          测试一下我的古代文明知识
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="rounded-xl w-[160px] cursor-pointer"
                    onClick={() => {
                      if (!promptTextareaRef.current) return;
                      promptTextareaRef.current.value = "超级英雄鲨鱼的故事";
                      setTimeout(() => {
                        handleSubmit();
                      }, 0);
                    }}
                  >
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        <HistoryEduOutlinedIcon
                          sx={{ color: purple[300], fontSize: 20 }}
                        />
                        <div className="text-[#676767] text-sm">
                          超级英雄鲨鱼的故事
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="hidden flex-1 gap-4 justify-center items-stretch @lg/intro:flex">
                  <Card
                    className="rounded-xl w-[160px] cursor-pointer"
                    onClick={() => {
                      if (!promptTextareaRef.current) return;
                      promptTextareaRef.current.value =
                        "用我最喜欢的体裁写一个故事";
                      setTimeout(() => {
                        handleSubmit();
                      }, 0);
                    }}
                  >
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        <LightbulbOutlinedIcon
                          sx={{ color: yellow[500], fontSize: 20 }}
                        />
                        <div className="text-[#676767] text-sm">
                          用我最喜欢的体裁写一个故事
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="rounded-xl w-[160px] cursor-pointer"
                    onClick={() => {
                      if (!promptTextareaRef.current) return;
                      promptTextareaRef.current.value =
                        "用于发送每日电子邮件报告的 Python 脚本";
                      setTimeout(() => {
                        handleSubmit();
                      }, 0);
                    }}
                  >
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        <TerminalOutlinedIcon
                          sx={{ color: red[300], fontSize: 20 }}
                        />
                        <div className="text-[#676767] text-sm">
                          用于发送每日电子邮件报告的 Python 脚本
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="px-2">
        <div className="mx-auto w-[80%] h-fit flex flex-nowrap gap-1.5 rounded-[26px] bg-[#f4f4f4] p-2">
          <textarea
            id="prompt-textarea"
            className="flex-1 bg-transparent resize-none outline-none p-[4px] min-h-[28px] h-[28px] max-h-[25dvh] leading-[20px] overflow-y-hidden"
            placeholder='给"ChatGPT"发送消息...'
            ref={promptTextareaRef}
          ></textarea>
          <Button
            variant="contained"
            disabled={!submittable}
            className="w-8 h-8 min-w-8 min-h-8 rounded-full flex items-center justify-center self-end"
            sx={{
              borderRadius: 9999,
              minWidth: 32,
            }}
            onClick={handleSubmit}
          >
            <ArrowUpwardIcon />
          </Button>
        </div>
        <div className="text-center p-2 text-xs text-slate-500">
          ChatGPT 也可能会犯错。请核查重要信息。
        </div>
      </div>
    </div>
  );
}

const MessageItem = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === "user";

  // render markdown content
  const markedContent = useMemo(() => {
    return mdi.render(msg.content);
  }, [msg.content]);

  return (
    <div className="px-3 py-2 leading-7">
      <div
        className={`flex w-full @lg/main:w-[70%] max-w-[768px] mx-auto ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`flex ${
            isUser
              ? "bg-[#f4f4f4] max-w-[70%] rounded-3xl px-5 py-2.5"
              : "w-full flex-nowrap gap-2"
          }`}
        >
          {isUser ? (
            <div
              dangerouslySetInnerHTML={{
                __html: markedContent,
              }}
            ></div>
          ) : (
            <>
              <div className="w-[32px] h-[32px] flex justify-center items-center rounded-full border border-zinc-200">
                <SmallAvatar alt="chatgpt" src="./chatgpt-6.svg" />
              </div>
              <div
                className="flex-1"
                dangerouslySetInnerHTML={{
                  __html: markedContent,
                }}
              ></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
