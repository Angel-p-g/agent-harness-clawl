function main(): void {
  const model = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'
  console.log(`dsh-mini model: ${model}`)
}

main()
