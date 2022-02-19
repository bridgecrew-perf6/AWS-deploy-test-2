const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      email: {
        type: Sequelize.STRING(40),
        allowNull: true,
        unique: true,
      },
      nick: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      // 기본 로그인 or 카카오 로그인
      provider: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'local',
      },
      // 카카오 로그인시 아이디
      snsId: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
    }, { 
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'User',
      tableName: 'users',
      // deletedAt에 날짜 제공 ( false 시 제거했을 때 모두 제거 됨 )
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
 
  static associate(db) {
    db.User.hasMany(db.Post);
    db.User.belongsToMany(db.User, {
      foreignKey: 'followingId',
      as: 'Followers',
      through: 'Follow',
    });
    db.User.belongsToMany(db.User, {
      foreignKey: 'followerId',
      as: 'Followings',
      through: 'Follow',
    });
    db.User.belongsToMany(db.Post, {
      foreignKey: 'UsersId',
      as: 'Liked',
      through: 'PostLike'
    })
  }
};