import argparse
import importlib
from pathlib import Path


def _import_training_stack():
    try:
        torch = importlib.import_module("torch")
        load_dataset = importlib.import_module("datasets").load_dataset
        TrainingArguments = importlib.import_module("transformers").TrainingArguments
        SFTTrainer = importlib.import_module("trl").SFTTrainer
        FastLanguageModel = importlib.import_module("unsloth").FastLanguageModel
    except Exception as exc:
        raise RuntimeError(
            "Missing training dependencies. Install with: pip install -r requirements_finetune.txt"
        ) from exc

    return torch, load_dataset, TrainingArguments, SFTTrainer, FastLanguageModel


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fine-tune InnerCircle LoRA adapter with Unsloth")
    parser.add_argument("--model", default="unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit")
    parser.add_argument("--seq-len", type=int, default=2048)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--grad-accum", type=int, default=4)
    parser.add_argument("--output-dir", default="./outputs/innercircle-lora")
    return parser.parse_args()


def ensure_gpu(torch) -> None:
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA GPU is required for this Unsloth training script. Run this on Colab/Kaggle/GPU VM.")


def main() -> None:
    args = parse_args()
    torch, load_dataset, TrainingArguments, SFTTrainer, FastLanguageModel = _import_training_stack()
    ensure_gpu(torch)

    base_dir = Path(__file__).resolve().parent
    train_path = base_dir / "train.jsonl"
    valid_path = base_dir / "valid.jsonl"

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model,
        max_seq_length=args.seq_len,
        load_in_4bit=True,
    )

    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_alpha=32,
        lora_dropout=0.05,
    )

    train_dataset = load_dataset("json", data_files=str(train_path), split="train")
    valid_dataset = load_dataset("json", data_files=str(valid_path), split="train")

    def to_text(example: dict) -> dict:
        text = tokenizer.apply_chat_template(
            example["messages"],
            tokenize=False,
            add_generation_prompt=False,
        )
        return {"text": text}

    train_dataset = train_dataset.map(to_text, remove_columns=train_dataset.column_names)
    valid_dataset = valid_dataset.map(to_text, remove_columns=valid_dataset.column_names)

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        learning_rate=args.lr,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        logging_steps=10,
        bf16=torch.cuda.is_bf16_supported(),
        fp16=not torch.cuda.is_bf16_supported(),
        report_to="none",
    )

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=valid_dataset,
        dataset_text_field="text",
        args=training_args,
        max_seq_length=args.seq_len,
    )

    trainer.train()
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print(f"Training complete. Adapter saved to: {args.output_dir}")


if __name__ == "__main__":
    main()
