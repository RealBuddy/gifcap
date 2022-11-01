import m from "mithril";
import { App, Gif, Recording, RenderOptions } from "./gifcap";
import PlayView from "./views/play";
import PreviewView from "./views/preview";
import RecordView from "./views/record";
import RenderView from "./views/render";
import StartView from "./views/start";

declare global {
  interface MediaDevices {
    getDisplayMedia(opts: { video: { width: number; height: number } }): MediaStream;
  }
}

const FPS = 12;

type State =
  | { name: "start" }
  | { name: "playing"; gif: Gif; recording: Recording; renderOptions: RenderOptions }
  | { name: "recording"; captureStream: MediaStream }
  | { name: "previewing"; recording: Recording; renderOptions?: RenderOptions }
  | { name: "rendering"; recording: Recording; renderOptions: RenderOptions };

function assertState<T extends State["name"], E extends T>(actual: T, expected: E): asserts actual is E {
  if (actual !== expected) {
    throw new Error("Invalid state");
  }
}

class Main implements App {
  readonly frameLength = Math.floor(1000 / FPS);

  private _state: State = { name: "start" };

  private get state(): State {
    return this._state;
  }

  private set state(state: State) {
    this._state = state;
    m.redraw();
  }

  constructor() {
    window.onbeforeunload = () => (this.state.name !== "start" ? "" : null);
  }

  view() {
    return m(
      "section",
      {
        id: "app",
        class: this.state.name === "start" ? "home" : "",
      },
      [
        m("section", { id: "app-body" }, [
          m("h1", [m("span", { class: "gif" }, "gif"), m("span", { class: "cap" }, "cap")]),
          this.body(),
        ]),
        m("footer", { id: "app-footer" }, [
          m("span.left", [
            m("a", { href: "https://github.com/joaomoreno/gifcap" }, [
              m("img", {
                alt: "GitHub",
                src: "https://icongr.am/octicons/mark-github.svg?size=18&color=9e9e9e",
              }),
              " joaomoreno/gifcap",
            ]),
          ]),
          m("span", [
            m(
              "a",
              {
                title: "Sponsor me!",
                href: "https://github.com/sponsors/joaomoreno",
              },
              [
                m("img", {
                  alt: "GitHub",
                  src: "https://icongr.am/material/coffee.svg?size=18&color=9e9e9e",
                }),
                " Like the tool? Sponsor me!",
              ]
            ),
          ]),
          m("span.right", [
            "Made with ",
            m("img", {
              alt: "love",
              src: "https://icongr.am/octicons/heart.svg?size=18&color=9e9e9e",
            }),
            " by ",
            m("a", { href: "https://github.com/joaomoreno" }, ["João Moreno"]),
          ]),
        ]),
      ]
    );
  }

  body() {
    switch (this.state.name) {
      case "start":
        return m(StartView, { app: this });
      case "playing":
        return m(PlayView, { app: this, gif: this.state.gif });
      case "recording":
        return m(RecordView, { app: this, captureStream: this.state.captureStream });
      case "previewing":
        return m(PreviewView, { app: this, recording: this.state.recording, renderOptions: this.state.renderOptions });
      case "rendering":
        return m(RenderView, { app: this, recording: this.state.recording, renderOptions: this.state.renderOptions });
    }
  }

  async startRecording() {
    try {
      const captureStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 9999, height: 9999 },
      });

      this.state = { name: "recording", captureStream };
      m.redraw.sync();
    } catch (err) {
      console.error(err);
      return;
    }
  }

  stopRecording(recording: Recording) {
    this.state = { name: "previewing", recording };
  }

  startRendering(renderOptions: RenderOptions) {
    assertState(this.state.name, "previewing");
    this.state = { name: "rendering", recording: this.state.recording, renderOptions };
  }

  finishRendering(gif: Gif) {
    assertState(this.state.name, "rendering");
    this.state = { name: "playing", gif, recording: this.state.recording, renderOptions: this.state.renderOptions };
  }

  cancelRendering() {
    assertState(this.state.name, "rendering");
    this.state = { name: "previewing", recording: this.state.recording, renderOptions: this.state.renderOptions };
  }

  editGif() {
    assertState(this.state.name, "playing");
    this.state = { name: "previewing", recording: this.state.recording, renderOptions: this.state.renderOptions };
  }

  async upload(gif: any) {
    try {

      const body = new FormData()
      const file = new File([gif.blob], gif.url+".gif");
      body.append("gif", file)
      const response:any  = await m.request({
        method: "POST",
        url: "/upload/upload",
        body: body,
      })
if (response && response.data){
  console.log("🚀 ~ file: main.ts ~ line 157 ~ Main ~ upload ~ response", response.data.name);
}
    } catch (err) {
      console.log("🚀 ~ file: main.ts ~ line 158 ~ Main ~ upload ~ err", err);
    }
    return true;
  }
  discardGif() {
    if (!window.confirm("This will discard the current recording, are you sure you want to continue?")) {
      return;
    }

    this.state = { name: "start" };
  }
}

function main() {
  m.mount(document.getElementById("app-container")!, Main);
}

main();
