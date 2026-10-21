import { useState } from 'react';
import { knowledgeDetails, knowledgeGroups, knowledgeNames } from '../data/knowledge';
import { instructionHelp } from './InstructionHelp';
export function KnowledgeLibrary({ initialTopic = 'normallyOpen' }: { initialTopic?: string }) {
  const [topic, setTopic] = useState(initialTopic);
  const entry = instructionHelp[topic],
    detail = knowledgeDetails[topic];
  return (
    <div className="knowledge-library">
      <nav aria-label="知识工具箱目录">
        {knowledgeGroups.map((group) => (
          <div key={group.title}>
            <h3>{group.title}</h3>
            {group.topics.map((key) => (
              <button key={key} aria-pressed={topic === key} onClick={() => setTopic(key)}>
                {instructionHelp[key]?.title.split(' · ')[0] ?? knowledgeNames[key]}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <article aria-label="知识讲解" key={topic}>
        <span className="eyebrow">按需回看 · 用一个例子理解</span>
        <h3>{entry?.title ?? knowledgeNames[topic]}</h3>
        <h4>它是什么、怎样工作？</h4>
        <p>{entry?.meaning ?? detail.purpose}</p>
        <h4>有什么用、为什么选它？</h4>
        <p>{detail.purpose}</p>
        <h4>与相近对象的区别</h4>
        <p>{detail.difference}</p>
        {entry && (
          <>
            <h4>最小例子</h4>
            <p>{entry.example}</p>
            <h4>容易出错的地方</h4>
            <p>{entry.mistake}</p>
          </>
        )}
        <h4>亲手验证：先预测，再扫描</h4>
        <p>{detail.practice}</p>
        <p className="notice-text">
          这里解释本软件的教学规则。虚拟地址与软件触点不代表真实PLC的接线、周期或安全能力。
        </p>
      </article>
    </div>
  );
}
