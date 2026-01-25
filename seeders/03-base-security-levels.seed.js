'use strict';

module.exports = {
  get: () => {
    const securityLevels = [
      {
        id: 1,
        slug: 'public',
        name: JSON.stringify({
          en: 'Public',
          de: 'Öffentlich',
          it: 'Pubblico',
          ja: '公開',
          ko: '공개',
          zh: '公开',
          pt: 'Público',
          ru: 'Общедоступный',
          es: 'Público',
          fr: 'Public',
        }),
        priority: 1,
        description: JSON.stringify({
          en: 'Information accessible to everyone without restrictions.',
          de: 'Informationen, die für alle ohne Einschränkungen zugänglich sind.',
          it: 'Informazioni accessibili a tutti senza restrizioni.',
          ja: '制限なく誰でもアクセスできる情報。',
          ko: '제한 없이 누구나 접근할 수 있는 정보입니다.',
          zh: '所有人都可以不受限制地访问的信息。',
          pt: 'Informações acessíveis a todos sem restrições.',
          ru: 'Информация, доступная всем без ограничений.',
          es: 'Información accesible para todos sin restricciones.',
          fr: 'Informations accessibles à tous sans restrictions.',
        }),
        is_default: 0,
      },
      {
        id: 2,
        slug: 'internal',
        name: JSON.stringify({
          en: 'Internal',
          de: 'Intern',
          it: 'Interno',
          ja: '社内',
          ko: '내부',
          zh: '内部',
          pt: 'Interno',
          ru: 'Внутренний',
          es: 'Interno',
          fr: 'Interne',
        }),
        priority: 2,
        description: JSON.stringify({
          en: 'Information intended only for employees and authorized collaborators.',
          de: 'Informationen, die nur für Mitarbeiter und autorisierte Mitarbeiter bestimmt sind.',
          it: 'Informazioni destinate solo a dipendenti e collaboratori autorizzati.',
          ja: '従業員および承認された協力者のみを対象とした情報。',
          ko: '직원 및 승인된 협력자만을 위한 정보입니다.',
          zh: '仅供员工和授权合作者使用的信息。',
          pt: 'Informações destinadas apenas a funcionários e colaboradores autorizados.',
          ru: 'Информация, предназначенная только для сотрудников и уполномоченных лиц.',
          es: 'Información destinada únicamente a empleados y colaboradores autorizados.',
          fr: 'Informations destinées uniquement aux employés et aux collaborateurs autorisés.',
        }),
        is_default: 1,
      },
      {
        id: 3,
        slug: 'sensitive',
        name: JSON.stringify({
          en: 'Sensitive',
          de: 'Vertraulich',
          it: 'Riservato',
          ja: '機密',
          ko: '민감',
          zh: '敏感',
          pt: 'Sensível',
          ru: 'Конфиденциальный',
          es: 'Sensible',
          fr: 'Confidentiel',
        }),
        priority: 3,
        description: JSON.stringify({
          en: 'Information that requires special protection due to its confidential nature.',
          de: 'Informationen, die aufgrund ihrer vertraulichen Natur besonderen Schutz erfordern.',
          it: 'Informazioni che richiedono una protezione speciale a causa della loro natura confidenziale.',
          ja: '機密性の高い性質により特別な保護を必要とする情報。',
          ko: '기밀성으로 인해 특별한 보호가 필요한 정보입니다.',
          zh: '因其机密性质需要特殊保护的信息。',
          pt: 'Informações que exigem proteção especial devido à sua natureza confidencial.',
          ru: 'Информация, требующая особой защиты ввиду её конфиденциального характера.',
          es: 'Información que requiere protección especial debido a su naturaleza confidencial.',
          fr: 'Informations nécessitant une protection particulière en raison de leur caractère confidentiel.',
        }),
        is_default: 0,
      },
      {
        id: 4,
        slug: 'restricted',
        name: JSON.stringify({
          en: 'Restricted',
          de: 'Streng Vertraulich',
          it: 'Riservatissimo',
          ja: '極秘',
          ko: '제한',
          zh: '受限',
          pt: 'Restrito',
          ru: 'Строго конфиденциальный',
          es: 'Restringido',
          fr: 'Strictement confidentiel',
        }),
        priority: 4,
        description: JSON.stringify({
          en: 'Highly sensitive information with very limited access, only for authorized personnel.',
          de: 'Höchst sensible Informationen mit sehr eingeschränktem Zugang, nur für autorisiertes Personal.',
          it: 'Informazioni altamente sensibili con accesso molto limitato, solo per il personale autorizzato.',
          ja: 'アクセスが非常に限られた極秘情報、承認された担当者のみ。',
          ko: '매우 제한된 접근이 가능한 고도로 민감한 정보이며 승인된 인원만 접근할 수 있습니다.',
          zh: '高度敏感的信息，访问权限非常有限，仅限授权人员。',
          pt: 'Informações altamente sensíveis com acesso muito limitado, apenas para pessoal autorizado.',
          ru: 'Высокочувствительная информация с очень ограниченным доступом, только для уполномоченного персонала.',
          es: 'Información altamente sensible con acceso muy limitado, solo para personal autorizado.',
          fr: 'Informations hautement sensibles avec un accès très limité, uniquement pour le personnel autorisé.',
        }),
        is_default: 0,
      },
    ];

    return securityLevels;
  },

  up: async (queryInterface) => {
    const batchSize = 10;
    const levels = this.get();

    for (let i = 0; i < levels.length; i += batchSize) {
      const batch = levels.slice(i, i + batchSize);
      for (const level of batch) {
        await queryInterface.bulkInsert('config_security_levels', [level], {
          updateOnDuplicate: ['slug', 'name', 'priority', 'description', 'is_default', 'updated_at'],
        });
      }
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('config_security_levels', null, {});
  },
};
