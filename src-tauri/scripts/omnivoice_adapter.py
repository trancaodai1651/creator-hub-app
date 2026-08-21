"""Small process adapter for the OmniVoice Python package."""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def emit(payload: dict, exit_code: int = 0) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)
    raise SystemExit(exit_code)


def load_runtime():
    try:
        import soundfile as sf
        import torch
        from omnivoice import OmniVoice, VoiceClonePrompt
    except Exception as error:  # pragma: no cover - depends on the user environment
        emit({"success": False, "installed": False, "message": f"Chưa cài lõi OmniVoice hoặc Python thiếu thư viện phụ thuộc: {error}"}, 1)
    return sf, torch, OmniVoice, VoiceClonePrompt


def resolve_device(torch, requested: str) -> str:
    if requested in {"gpu", "cuda"} and torch.cuda.is_available():
        return "cuda:0"
    if requested == "cpu":
        return "cpu"
    return "cuda:0" if torch.cuda.is_available() else "cpu"


def load_model(OmniVoice, torch, model_id: str, device: str):
    target = resolve_device(torch, device)
    dtype = torch.float16 if target.startswith("cuda") else torch.float32
    return OmniVoice.from_pretrained(model_id, device_map=target, dtype=dtype), target


def command_status() -> None:
    try:
        import torch
        installed = importlib.util.find_spec("omnivoice") is not None
        emit({
            "success": True,
            "installed": installed,
            "torchInstalled": True,
            "cudaAvailable": bool(torch.cuda.is_available()),
            "device": "cuda:0" if torch.cuda.is_available() else "cpu",
            "model": "k2-fsa/OmniVoice",
            "message": "OmniVoice đã sẵn sàng." if installed else "Chưa cài OmniVoice.",
        })
    except Exception as error:
        emit({
            "success": True,
            "installed": False,
            "torchInstalled": False,
            "cudaAvailable": False,
            "device": "cpu",
            "model": "k2-fsa/OmniVoice",
            "message": f"Python chưa có PyTorch hoặc OmniVoice: {error}",
        })


def command_clone(args) -> None:
    _, torch, OmniVoice, _ = load_runtime()
    if not args.ref_audio or not Path(args.ref_audio).exists():
        emit({"success": False, "message": "Không tìm thấy âm thanh mẫu."}, 1)
    if not args.ref_text.strip():
        emit({"success": False, "message": "Cần nội dung của âm thanh mẫu."}, 1)
    model, target = load_model(OmniVoice, torch, args.model, args.device)
    prompt = model.create_voice_clone_prompt(args.ref_audio, args.ref_text)
    Path(args.prompt_path).parent.mkdir(parents=True, exist_ok=True)
    prompt.save(args.prompt_path)
    emit({"success": True, "installed": True, "device": target, "message": "Đã lưu giọng clone vào project."})


def command_generate(args) -> None:
    sf, torch, OmniVoice, VoiceClonePrompt = load_runtime()
    model, target = load_model(OmniVoice, torch, args.model, args.device)
    kwargs = {"text": args.text, "language": None if args.language in {"", "auto"} else args.language}
    if args.prompt_path:
        kwargs["voice_clone_prompt"] = VoiceClonePrompt.load(args.prompt_path)
    elif args.ref_audio:
        kwargs["ref_audio"] = args.ref_audio
        if args.ref_text:
            kwargs["ref_text"] = args.ref_text
    if args.instruct:
        kwargs["instruct"] = args.instruct
    audio = model.generate(**kwargs)
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    sf.write(args.output, audio[0], model.sampling_rate)
    emit({"success": True, "installed": True, "device": target, "language": kwargs["language"] or "auto", "message": "Đã tạo tệp giọng đọc."})


def make_parser() -> argparse.ArgumentParser:
    cli = argparse.ArgumentParser()
    cli.add_argument("action", choices=["status", "clone", "generate"])
    cli.add_argument("--text", default="")
    cli.add_argument("--language", default="auto")
    cli.add_argument("--output", default="")
    cli.add_argument("--ref-audio", default="")
    cli.add_argument("--ref-text", default="")
    cli.add_argument("--prompt-path", default="")
    cli.add_argument("--instruct", default="")
    cli.add_argument("--device", default="auto")
    cli.add_argument("--model", default="k2-fsa/OmniVoice")
    return cli


def main() -> None:
    args = make_parser().parse_args()
    if args.action == "status":
        command_status()
    elif args.action == "clone":
        command_clone(args)
    else:
        command_generate(args)


if __name__ == "__main__":
    main()
