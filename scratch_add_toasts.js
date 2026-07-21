const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/tabs');

const configs = [
  {
    file: 'vendas-view.tsx',
    replacements: [
      { func: /const handleAddSale = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Venda registrada com sucesso!', error: 'Erro ao registrar venda' },
      { func: /const handleUpdateSale = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Venda atualizada com sucesso!', error: 'Erro ao atualizar venda' },
      { func: /const handleConfirmDelete = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Venda excluída com sucesso!', error: 'Erro ao excluir venda' }
    ]
  },
  {
    file: 'metas-view.tsx',
    replacements: [
      { func: /const handleCreate = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Meta criada com sucesso!', error: 'Erro ao criar meta' },
      { func: /const handleUpdate = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Meta atualizada com sucesso!', error: 'Erro ao atualizar meta' },
      { func: /const handleConfirmDelete = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Meta excluída com sucesso!', error: 'Erro ao excluir meta' }
    ]
  },
  {
    file: 'funcionarios-view.tsx',
    replacements: [
      { func: /const handleAddEmployee = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Funcionário cadastrado com sucesso!', error: 'Erro ao cadastrar funcionário' },
      { func: /const handleUpdateEmployee = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Funcionário atualizado com sucesso!', error: 'Erro ao atualizar funcionário' },
      { func: /const handleConfirmDelete = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Funcionário excluído com sucesso!', error: 'Erro ao excluir funcionário' }
    ]
  },
  {
    file: 'pecas-view.tsx',
    replacements: [
      { func: /const handleCreate = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Peça adicionada com sucesso!', error: 'Erro ao adicionar peça' },
      { func: /const handleUpdate = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Peça atualizada com sucesso!', error: 'Erro ao atualizar peça' },
      { func: /const handleConfirmDelete = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Peça excluída com sucesso!', error: 'Erro ao excluir peça' }
    ]
  },
  {
    file: 'orcamentos-view.tsx',
    replacements: [
      { func: /const handleCreate = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Orçamento criado com sucesso!', error: 'Erro ao criar orçamento' },
      { func: /const handleUpdate = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Orçamento atualizado com sucesso!', error: 'Erro ao atualizar orçamento' },
      { func: /const handleConfirmDelete = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Orçamento excluído com sucesso!', error: 'Erro ao excluir orçamento' },
      { func: /const handleApprove = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Orçamento aprovado!', error: 'Erro ao aprovar orçamento' },
      { func: /const handleReject = async.*?\{[\s\S]*?catch \(err\) \{/g, success: 'Orçamento rejeitado!', error: 'Erro ao rejeitar orçamento' }
    ]
  },
  {
    file: 'relatorios-view.tsx',
    replacements: [
      { func: /const handleGenerate = async.*?\{[\s\S]*?catch \(e\) \{/g, success: 'Relatório gerado com sucesso!', error: 'Erro ao gerar relatório' }
    ]
  }
];

configs.forEach(config => {
  const filePath = path.join(dir, config.file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import if not present
  if (!content.includes('import { toast } from "sonner"')) {
    content = content.replace(/(import .* from "react";\r?\n)/, '$1import { toast } from "sonner";\n');
  }

  config.replacements.forEach(rep => {
    // Find the try block end and the catch block
    // We will inject the toast.success just before `} catch`
    // and toast.error just after `catch (...) { \n console.error(...)`
    
    // Actually, a simpler way is to find the function, then find `} catch` within it.
    let match;
    const regex = new RegExp(rep.func.source, rep.func.flags);
    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      // The end of fullMatch is `} catch (err) {` or `} catch (e) {`
      const catchIndex = fullMatch.lastIndexOf('} catch');
      if (catchIndex === -1) continue;
      
      const beforeCatch = fullMatch.substring(0, catchIndex);
      const afterCatch = fullMatch.substring(catchIndex);
      
      // Inject success toast if not already there
      let newBeforeCatch = beforeCatch;
      if (!newBeforeCatch.includes('toast.success')) {
         // insert before the last newline/spaces
         newBeforeCatch = newBeforeCatch.replace(/(\s*)$/, `\n      toast.success("${rep.success}");$1`);
      }
      
      content = content.substring(0, match.index) + newBeforeCatch + afterCatch + content.substring(match.index + fullMatch.length);
      
      // Now inject error toast
      // The `catch (err) {` is at match.index + newBeforeCatch.length
      // Let's just do a generic replace on the file for the error toasts since we know where they are.
      // Wait, we can just replace `catch (err) {\n      console.error(err);` with `... toast.error`
    }
  });

  // Inject error toasts for the catch blocks
  configs.forEach(cfg => {
     if(cfg.file === config.file) {
        cfg.replacements.forEach(rep => {
           // To inject error toast, we need a different approach since the function regex stops at `catch (err) {`
           // Let's just do a global replace for all catch blocks in the file?
           // No, we need specific error messages.
        });
     }
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${config.file}`);
});
